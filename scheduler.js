const cron = require("node-cron");
const { getEnabledAutoReminders, updateLastSent } = require("./sheets");
const { sendMessageToGroup } = require("./whatsapp");
const {
  checkTomorrowHoliday,
  formatDateYYYYMMDD,
  getHolidays,
} = require("./holidays");

let isProcessing = false;

// Timezone: Asia/Jakarta (UTC+7)
const TIMEZONE = "Asia/Jakarta";

/**
 * Get current time in Jakarta timezone
 * @returns {Date} - Current date/time in Jakarta
 */
function getJakartaTime() {
  const now = new Date();
  // Get Jakarta time by using toLocaleString with timezone
  const jakartaString = now.toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(jakartaString);
}

/**
 * Format time as HH:mm
 * @param {Date} date - Date object
 * @returns {string} - Formatted time string
 */
function formatTimeHHMM(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Check if today is Friday
 * @param {Date} date - Date object
 * @returns {boolean} - True if Friday
 */
function isFriday(date) {
  return date.getDay() === 5; // 0 = Sunday, 5 = Friday
}

/**
 * Process Friday auto reminders
 * @param {Array} reminders - Array of friday_auto reminders
 * @param {Date} now - Current Jakarta time
 * @param {string} todayStr - Today's date in YYYY-MM-DD format
 * @param {string} currentTime - Current time in HH:mm format
 */
async function processFridayReminders(reminders, now, todayStr, currentTime) {
  const fridayReminders = reminders.filter((r) => r.type === "friday_auto");

  if (fridayReminders.length === 0) {
    return;
  }

  // Check if today is Friday
  if (!isFriday(now)) {
    console.log("📅 Today is not Friday, skipping Friday reminders");
    return;
  }

  console.log("🗓️ Today is Friday! Checking Friday reminders...");

  for (const reminder of fridayReminders) {
    try {
      // Trim trigger_time to handle any whitespace issues from spreadsheet
      const reminderTriggerTime = (reminder.trigger_time || "").trim();

      console.log(`   Checking reminder ${reminder.id}:`);
      console.log(`     - Trigger time in sheet: "${reminderTriggerTime}"`);
      console.log(`     - Current time: "${currentTime}"`);
      console.log(`     - Last sent: "${reminder.last_sent || "never"}"`);

      // Check if trigger time matches current time
      if (reminderTriggerTime !== currentTime) {
        console.log(`     - ⏰ Time not matched, skipping`);
        continue;
      }

      // Check if already sent today
      if (reminder.last_sent === todayStr) {
        console.log(`⏭️ Friday reminder ${reminder.id} already sent today`);
        continue;
      }

      console.log(`\n📤 Sending Friday reminder: ${reminder.id}`);
      console.log(`   Message: ${reminder.message.substring(0, 50)}...`);
      console.log(`   Group: ${reminder.group_id}`);
      console.log(`   Trigger Time: ${reminder.trigger_time}`);

      // Send the message
      await sendMessageToGroup(reminder.group_id, reminder.message);

      // Update last_sent
      await updateLastSent(reminder.id, todayStr);

      console.log(`✅ Friday reminder ${reminder.id} sent successfully!`);
      console.log(`🎉 FRIDAY REMINDER SENT - ID: ${reminder.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to send Friday reminder ${reminder.id}:`,
        error.message
      );
    }
  }
}

/**
 * Process Holiday auto reminders (1 day before holiday/weekend period)
 * @param {Array} reminders - Array of holiday_auto reminders
 * @param {Date} now - Current Jakarta time
 * @param {string} todayStr - Today's date in YYYY-MM-DD format
 * @param {string} currentTime - Current time in HH:mm format
 */
async function processHolidayReminders(reminders, now, todayStr, currentTime) {
  const holidayReminders = reminders.filter((r) => r.type === "holiday_auto");

  if (holidayReminders.length === 0) {
    return;
  }

  console.log("🎌 Checking holiday reminders...");
  console.log(`   Found ${holidayReminders.length} holiday_auto reminder(s)`);

  // Check if tomorrow starts a holiday period (national holiday or weekend)
  const tomorrowHoliday = await checkTomorrowHoliday(now);

  if (!tomorrowHoliday) {
    console.log(
      "📅 Tomorrow is a regular working day - no holiday reminder needed"
    );
    return;
  }

  console.log(
    `🎉 Tomorrow starts a holiday period: ${tomorrowHoliday.localName}! Processing holiday reminders...`
  );

  for (const reminder of holidayReminders) {
    try {
      // Trim trigger_time to handle any whitespace issues from spreadsheet
      const reminderTriggerTime = (reminder.trigger_time || "").trim();

      console.log(`   Checking reminder ${reminder.id}:`);
      console.log(`     - Trigger time in sheet: "${reminderTriggerTime}"`);
      console.log(`     - Current time: "${currentTime}"`);
      console.log(`     - Last sent: "${reminder.last_sent || "never"}"`);

      // Check if trigger time matches current time
      if (reminderTriggerTime !== currentTime) {
        console.log(`     - ⏰ Time not matched, skipping`);
        continue;
      }

      // Check if already sent today (prevents duplicate for same holiday)
      if (reminder.last_sent === todayStr) {
        console.log(`⏭️ Holiday reminder ${reminder.id} already sent today`);
        continue;
      }

      // Enhance message with holiday info (only for national holidays, not regular weekends)
      let enhancedMessage = reminder.message;

      if (tomorrowHoliday.isRegularWeekend) {
        // Regular weekend - just send the original message without extra info
        // The message already mentions about coordination before holidays
        enhancedMessage = reminder.message;
      } else if (
        tomorrowHoliday.isWeekend &&
        tomorrowHoliday.connectedHoliday
      ) {
        // Weekend connected to national holiday
        const holidayDescription = `${tomorrowHoliday.connectedHoliday.localName} (${tomorrowHoliday.connectedHoliday.date}) + Akhir Pekan`;
        enhancedMessage = `${reminder.message}\n\n📅 Besok adalah ${holidayDescription}`;
      } else {
        // National holiday
        enhancedMessage = `${reminder.message}\n\n📅 Besok adalah ${tomorrowHoliday.localName} (${tomorrowHoliday.date})`;
      }

      console.log(`\n📤 Sending Holiday reminder: ${reminder.id}`);
      console.log(`   Holiday: ${tomorrowHoliday.localName}`);
      console.log(`   Message: ${reminder.message.substring(0, 50)}...`);
      console.log(`   Group: ${reminder.group_id}`);
      console.log(`   Trigger Time: ${reminder.trigger_time}`);

      // Send the message
      await sendMessageToGroup(reminder.group_id, enhancedMessage);

      // Update last_sent
      await updateLastSent(reminder.id, todayStr);

      console.log(`✅ Holiday reminder ${reminder.id} sent successfully!`);
      console.log(
        `🎉 HOLIDAY REMINDER SENT - ID: ${reminder.id} - Holiday: ${tomorrowHoliday.localName}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send Holiday reminder ${reminder.id}:`,
        error.message
      );
    }
  }
}

/**
 * Process all auto reminders
 * Checks for due reminders and sends WhatsApp messages
 */
async function processAutoReminders() {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log("⏳ Already processing reminders, skipping this cycle...");
    return;
  }

  isProcessing = true;

  try {
    const now = getJakartaTime();
    const todayStr = formatDateYYYYMMDD(now);
    const currentTime = formatTimeHHMM(now);

    console.log(`\n🔍 [${todayStr} ${currentTime}] Checking auto reminders...`);
    console.log(
      `   Day: ${
        [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][now.getDay()]
      }`
    );

    // Get all enabled reminders
    const enabledReminders = await getEnabledAutoReminders();

    if (enabledReminders.length === 0) {
      console.log("📭 No enabled auto reminders configured");
      return;
    }

    console.log(`📋 Found ${enabledReminders.length} enabled auto reminder(s)`);

    // Process Friday reminders
    await processFridayReminders(enabledReminders, now, todayStr, currentTime);

    // Process Holiday reminders
    await processHolidayReminders(enabledReminders, now, todayStr, currentTime);
  } catch (error) {
    console.error("❌ Error processing auto reminders:", error.message);
  } finally {
    isProcessing = false;
  }
}

/**
 * Pre-fetch holidays for the current year on startup
 */
async function prefetchHolidays() {
  try {
    const now = getJakartaTime();
    const year = now.getFullYear();
    console.log(`📅 Pre-fetching holidays for ${year}...`);
    await getHolidays(year);
    // Also fetch next year if we're in December
    if (now.getMonth() === 11) {
      console.log(`📅 Also fetching holidays for ${year + 1}...`);
      await getHolidays(year + 1);
    }
  } catch (error) {
    console.error("❌ Failed to pre-fetch holidays:", error.message);
  }
}

/**
 * Start the reminder scheduler
 * Runs every minute to check for pending reminders
 */
function startScheduler() {
  console.log("\n========================================");
  console.log("⏰ Starting Auto Reminder Scheduler...");
  console.log("   Schedule: Every minute");
  console.log("   Timezone: Asia/Jakarta (WIB)");
  console.log("   Features: Friday + Holiday Reminders");
  console.log("========================================\n");

  // Pre-fetch holidays
  prefetchHolidays();

  // Run every minute
  cron.schedule("* * * * *", async () => {
    await processAutoReminders();
  });

  // Also run immediately on startup
  console.log("🚀 Running initial auto reminder check...");
  setTimeout(() => {
    processAutoReminders();
  }, 3000); // Wait 3 seconds for WhatsApp to initialize
}

module.exports = {
  startScheduler,
  processAutoReminders,
  getJakartaTime,
  formatTimeHHMM,
  isFriday,
};

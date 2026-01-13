const express = require("express");
const router = express.Router();
const {
  addAutoReminder,
  getAutoReminders,
  updateReminderEnabled,
  deleteAutoReminder,
} = require("../sheets");
const { getUpcomingHolidays } = require("../holidays");

/**
 * GET /health - Health check endpoint for Railway
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Generate a unique ID for reminders
 * Uses timestamp + random string for uniqueness
 */
function generateUniqueId(prefix = "REM") {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * GET / - Render the reminder form
 */
router.get("/", async (req, res) => {
  try {
    // Get existing reminders for display
    const reminders = await getAutoReminders();

    // Get upcoming holidays
    const upcomingHolidays = await getUpcomingHolidays(5);

    res.render("index", {
      title: "WhatsApp Auto Reminder",
      message: null,
      error: null,
      reminders: reminders,
      upcomingHolidays: upcomingHolidays,
    });
  } catch (error) {
    console.error("❌ Error loading page:", error.message);
    res.render("index", {
      title: "WhatsApp Auto Reminder",
      message: null,
      error: "Failed to load reminders",
      reminders: [],
      upcomingHolidays: [],
    });
  }
});

/**
 * POST /reminder - Save a new auto reminder to Google Sheets
 */
router.post("/reminder", async (req, res) => {
  try {
    const { message, group_id, trigger_time, friday_enabled, holiday_enabled } =
      req.body;

    // Validate input
    if (!message || !group_id || !trigger_time) {
      const reminders = await getAutoReminders();
      const upcomingHolidays = await getUpcomingHolidays(5);
      return res.render("index", {
        title: "WhatsApp Auto Reminder",
        message: null,
        error: "Message, Group ID, and Trigger Time are required!",
        reminders: reminders,
        upcomingHolidays: upcomingHolidays,
      });
    }

    // Validate at least one type is selected
    if (!friday_enabled && !holiday_enabled) {
      const reminders = await getAutoReminders();
      const upcomingHolidays = await getUpcomingHolidays(5);
      return res.render("index", {
        title: "WhatsApp Auto Reminder",
        message: null,
        error: "Please select at least one reminder type (Friday or Holiday)!",
        reminders: reminders,
        upcomingHolidays: upcomingHolidays,
      });
    }

    // Validate group ID format
    if (!group_id.includes("@g.us")) {
      const reminders = await getAutoReminders();
      const upcomingHolidays = await getUpcomingHolidays(5);
      return res.render("index", {
        title: "WhatsApp Auto Reminder",
        message: null,
        error: "Invalid Group ID format. It should end with @g.us",
        reminders: reminders,
        upcomingHolidays: upcomingHolidays,
      });
    }

    // Validate trigger time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(trigger_time)) {
      const reminders = await getAutoReminders();
      const upcomingHolidays = await getUpcomingHolidays(5);
      return res.render("index", {
        title: "WhatsApp Auto Reminder",
        message: null,
        error: "Invalid time format. Please use HH:mm (24-hour format)",
        reminders: reminders,
        upcomingHolidays: upcomingHolidays,
      });
    }

    // Normalize time format (ensure 2 digits for hours)
    const [hours, minutes] = trigger_time.split(":");
    const normalizedTime = `${hours.padStart(2, "0")}:${minutes}`;

    const createdReminders = [];

    // Create Friday reminder if enabled
    if (friday_enabled) {
      const fridayId = generateUniqueId("FRI");
      await addAutoReminder({
        id: fridayId,
        message: message,
        group_id: group_id,
        trigger_time: normalizedTime,
        type: "friday_auto",
        rule: "every_friday",
      });
      createdReminders.push(fridayId);
      console.log(`✅ Friday auto reminder created: ${fridayId}`);
    }

    // Create Holiday reminder if enabled
    if (holiday_enabled) {
      const holidayId = generateUniqueId("HOL");
      await addAutoReminder({
        id: holidayId,
        message: message,
        group_id: group_id,
        trigger_time: normalizedTime,
        type: "holiday_auto",
        rule: "before_national_holiday",
      });
      createdReminders.push(holidayId);
      console.log(`✅ Holiday auto reminder created: ${holidayId}`);
    }

    // Get updated reminders list
    const reminders = await getAutoReminders();
    const upcomingHolidays = await getUpcomingHolidays(5);

    res.render("index", {
      title: "WhatsApp Auto Reminder",
      message: `Auto reminder(s) saved successfully! IDs: ${createdReminders.join(
        ", "
      )}`,
      error: null,
      reminders: reminders,
      upcomingHolidays: upcomingHolidays,
    });
  } catch (error) {
    console.error("❌ Error saving reminder:", error.message);
    const upcomingHolidays = await getUpcomingHolidays(5);
    res.render("index", {
      title: "WhatsApp Auto Reminder",
      message: null,
      error: "Failed to save reminder. Please try again.",
      reminders: [],
      upcomingHolidays: upcomingHolidays,
    });
  }
});

/**
 * POST /reminder/toggle - Toggle reminder enabled status
 */
router.post("/reminder/toggle", async (req, res) => {
  try {
    const { id, enabled } = req.body;

    await updateReminderEnabled(id, enabled === "true");

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error toggling reminder:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /reminder/delete - Delete a reminder
 */
router.post("/reminder/delete", async (req, res) => {
  try {
    const { id } = req.body;

    await deleteAutoReminder(id);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting reminder:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /reminders - Get all reminders (API endpoint)
 */
router.get("/reminders", async (req, res) => {
  try {
    const reminders = await getAutoReminders();
    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reminders",
    });
  }
});

/**
 * GET /holidays - Get upcoming holidays (API endpoint)
 */
router.get("/holidays", async (req, res) => {
  try {
    const holidays = await getUpcomingHolidays(10);
    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    console.error("❌ Error fetching holidays:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch holidays",
    });
  }
});

module.exports = router;

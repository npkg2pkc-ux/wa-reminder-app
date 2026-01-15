const { google } = require("googleapis");
require("dotenv").config();

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "AutoReminders";
const RANGE = `${SHEET_NAME}!A:H`;

// Get private key with proper formatting
function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) {
    console.error("❌ GOOGLE_PRIVATE_KEY is not set!");
    return null;
  }
  // Handle both escaped and unescaped newlines
  return key.replace(/\\n/g, "\n");
}

// Initialize Google Sheets API authentication
let auth = null;
let sheets = null;

function initAuth() {
  const privateKey = getPrivateKey();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail || !SHEET_ID) {
    console.error("❌ Missing Google Sheets credentials:");
    console.error("   - GOOGLE_SHEET_ID:", SHEET_ID ? "✓" : "✗");
    console.error(
      "   - GOOGLE_SERVICE_ACCOUNT_EMAIL:",
      clientEmail ? "✓" : "✗"
    );
    console.error("   - GOOGLE_PRIVATE_KEY:", privateKey ? "✓" : "✗");
    return false;
  }

  auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheets = google.sheets({ version: "v4", auth });
  return true;
}

/**
 * Initialize the Google Sheet with headers if empty
 */
async function initializeSheet() {
  // Initialize auth first
  if (!initAuth()) {
    throw new Error("Failed to initialize Google Sheets authentication");
  }

  try {
    // Check if sheet exists, if not create headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:H1`,
    });

    // If no headers exist, add them
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              "id",
              "message",
              "group_id",
              "trigger_time",
              "type",
              "rule",
              "last_sent",
              "enabled",
            ],
          ],
        },
      });
      console.log("📊 Google Sheet initialized with headers for AutoReminders");
    }
  } catch (error) {
    // If sheet doesn't exist, try to create it
    if (error.message.includes("Unable to parse range")) {
      console.log("📊 Creating AutoReminders sheet...");
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: SHEET_NAME,
                  },
                },
              },
            ],
          },
        });

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_NAME}!A1:H1`,
          valueInputOption: "RAW",
          resource: {
            values: [
              [
                "id",
                "message",
                "group_id",
                "trigger_time",
                "type",
                "rule",
                "last_sent",
                "enabled",
              ],
            ],
          },
        });
        console.log("📊 AutoReminders sheet created with headers");
      } catch (createError) {
        console.error("❌ Error creating sheet:", createError.message);
        throw createError;
      }
    } else {
      console.error("❌ Error initializing sheet:", error.message);
      throw error;
    }
  }
}

/**
 * Convert Excel/Sheets time value to HH:mm format
 * Excel stores time as a decimal fraction of a day (e.g., 0.5 = 12:00)
 * @param {string|number} timeValue - Time value from sheet
 * @returns {string} - Time in HH:mm format
 */
function parseTimeValue(timeValue) {
  if (!timeValue) return "";

  // If it's already in HH:mm format, return as-is (trimmed)
  const strValue = String(timeValue).trim();
  if (/^\d{1,2}:\d{2}$/.test(strValue)) {
    // Ensure HH:mm format with leading zero
    const [hours, minutes] = strValue.split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  // If it's a decimal (Excel time format), convert it
  const numValue = parseFloat(strValue);
  if (!isNaN(numValue) && numValue >= 0 && numValue < 1) {
    const totalMinutes = Math.round(numValue * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  // If it's a larger number, might be total minutes or some other format
  // Just return trimmed string
  return strValue;
}

/**
 * Get all auto reminders from Google Sheets
 * @returns {Promise<Array>} - Array of reminder objects
 */
async function getAutoReminders() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      return [];
    }

    // Skip header row and map to objects
    const reminders = rows.slice(1).map((row, index) => ({
      id: row[0] || "",
      message: row[1] || "",
      group_id: row[2] || "",
      trigger_time: parseTimeValue(row[3]),
      type: row[4] || "",
      rule: row[5] || "",
      last_sent: row[6] || "",
      enabled: row[7] === "true" || row[7] === "TRUE",
      rowIndex: index + 2, // Actual row number in sheet (1-indexed, +1 for header)
    }));

    console.log(
      `📋 Retrieved ${reminders.length} auto reminders from Google Sheets`
    );

    // Log parsed trigger times for debugging
    reminders.forEach((r) => {
      console.log(
        `   - ${r.id}: trigger_time="${r.trigger_time}", type=${r.type}, enabled=${r.enabled}`
      );
    });

    return reminders;
  } catch (error) {
    console.error("❌ Error getting auto reminders:", error.message);
    throw error;
  }
}

/**
 * Get enabled auto reminders
 * @returns {Promise<Array>} - Array of enabled reminder objects
 */
async function getEnabledAutoReminders() {
  const reminders = await getAutoReminders();
  return reminders.filter((r) => r.enabled === true);
}

/**
 * Add a new auto reminder to Google Sheets
 * @param {Object} data - Reminder data
 * @returns {Promise<Object>} - The added reminder
 */
async function addAutoReminder(data) {
  try {
    const { id, message, group_id, trigger_time, type, rule } = data;
    const last_sent = "";
    const enabled = "true";

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [
          [id, message, group_id, trigger_time, type, rule, last_sent, enabled],
        ],
      },
    });

    console.log(`✅ Auto reminder added with ID: ${id}`);
    return {
      id,
      message,
      group_id,
      trigger_time,
      type,
      rule,
      last_sent,
      enabled: true,
    };
  } catch (error) {
    console.error("❌ Error adding auto reminder:", error.message);
    throw error;
  }
}

/**
 * Update the last_sent date of a reminder
 * @param {string} id - The reminder ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<boolean>} - Success status
 */
async function updateLastSent(id, date) {
  try {
    // First, get all reminders to find the row index
    const reminders = await getAutoReminders();
    const reminder = reminders.find((r) => r.id === id);

    if (!reminder) {
      console.error(`❌ Reminder with ID ${id} not found`);
      return false;
    }

    // Update the last_sent column (column G)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!G${reminder.rowIndex}`,
      valueInputOption: "RAW",
      resource: {
        values: [[date]],
      },
    });

    console.log(`✅ Reminder ${id} last_sent updated to: ${date}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating last_sent:", error.message);
    throw error;
  }
}

/**
 * Update the enabled status of a reminder
 * @param {string} id - The reminder ID
 * @param {boolean} enabled - The new enabled status
 * @returns {Promise<boolean>} - Success status
 */
async function updateReminderEnabled(id, enabled) {
  try {
    const reminders = await getAutoReminders();
    const reminder = reminders.find((r) => r.id === id);

    if (!reminder) {
      console.error(`❌ Reminder with ID ${id} not found`);
      return false;
    }

    // Update the enabled column (column H)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!H${reminder.rowIndex}`,
      valueInputOption: "RAW",
      resource: {
        values: [[enabled ? "true" : "false"]],
      },
    });

    console.log(`✅ Reminder ${id} enabled updated to: ${enabled}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating reminder enabled status:", error.message);
    throw error;
  }
}

/**
 * Delete an auto reminder
 * @param {string} id - The reminder ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteAutoReminder(id) {
  try {
    const reminders = await getAutoReminders();
    const reminder = reminders.find((r) => r.id === id);

    if (!reminder) {
      console.error(`❌ Reminder with ID ${id} not found`);
      return false;
    }

    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === SHEET_NAME
    );
    if (!sheet) {
      console.error(`❌ Sheet ${SHEET_NAME} not found`);
      return false;
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: reminder.rowIndex - 1,
                endIndex: reminder.rowIndex,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Reminder ${id} deleted`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting reminder:", error.message);
    throw error;
  }
}

module.exports = {
  initializeSheet,
  getAutoReminders,
  getEnabledAutoReminders,
  addAutoReminder,
  updateLastSent,
  updateReminderEnabled,
  deleteAutoReminder,
};

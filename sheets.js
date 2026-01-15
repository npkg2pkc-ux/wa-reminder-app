const { google } = require("googleapis");
require("dotenv").config();

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Reminders";

let sheets = null;

// Initialize Google Sheets
function initSheets() {
  if (sheets) return true;

  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  );
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail || !SHEET_ID) {
    console.error("❌ Missing Google Sheets credentials");
    return false;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheets = google.sheets({ version: "v4", auth });
  return true;
}

// Generate simple ID
function generateId() {
  return "R" + Date.now().toString(36).toUpperCase();
}

// Initialize sheet with headers
async function initializeSheet() {
  if (!initSheets()) throw new Error("Failed to init Google Sheets");

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:G1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:G1`,
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              "id",
              "name",
              "send_date",
              "send_time",
              "target_id",
              "message",
              "status",
            ],
          ],
        },
      });
      console.log("📊 Sheet initialized with headers");
    }
  } catch (error) {
    if (error.message.includes("Unable to parse range")) {
      // Create sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        },
      });
      await initializeSheet();
    } else {
      throw error;
    }
  }
}

// Get all reminders
async function getReminders() {
  if (!initSheets()) return [];

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:G`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    return rows
      .slice(1)
      .map((row) => ({
        id: row[0] || "",
        name: row[1] || "",
        send_date: row[2] || "",
        send_time: row[3] || "",
        target_id: row[4] || "",
        message: row[5] || "",
        status: row[6] || "pending",
      }))
      .filter((r) => r.id);
  } catch (error) {
    console.error("❌ Error getting reminders:", error.message);
    return [];
  }
}

// Add new reminder
async function addReminder(data) {
  if (!initSheets()) throw new Error("Failed to init Google Sheets");

  const id = generateId();
  const row = [
    id,
    data.name || "",
    data.send_date || "",
    data.send_time || "",
    data.target_id || "",
    data.message || "",
    "pending",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "RAW",
    resource: { values: [row] },
  });

  console.log("✅ Reminder added:", id);
  return id;
}

// Delete reminder by ID
async function deleteReminder(id) {
  if (!initSheets()) throw new Error("Failed to init Google Sheets");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error("Reminder not found");
  }

  // Get sheet ID
  const sheetInfo = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });
  const sheet = sheetInfo.data.sheets.find(
    (s) => s.properties.title === SHEET_NAME
  );
  const sheetId = sheet.properties.sheetId;

  // Delete row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  console.log("✅ Reminder deleted:", id);
  return true;
}

// Update reminder status
async function updateStatus(id, status) {
  if (!initSheets()) throw new Error("Failed to init Google Sheets");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error("Reminder not found");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!G${rowIndex + 1}`,
    valueInputOption: "RAW",
    resource: { values: [[status]] },
  });

  console.log("✅ Status updated:", id, "->", status);
  return true;
}

// Get reminder by ID
async function getReminder(id) {
  const reminders = await getReminders();
  return reminders.find((r) => r.id === id);
}

module.exports = {
  initializeSheet,
  getReminders,
  addReminder,
  deleteReminder,
  updateStatus,
  getReminder,
};

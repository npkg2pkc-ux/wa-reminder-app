const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

let sock = null;
let latestQRCode = null;
let connectionStatus = "disconnected";
let groupList = [];

const AUTH_FOLDER = "./auth_info";

// Silent logger for Baileys
const logger = pino({ level: "silent" });

// Initialize WhatsApp connection
async function initialize() {
  console.log("🚀 Starting WhatsApp (Baileys)...");

  // Ensure auth folder exists
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["WhatsApp Reminder", "Chrome", "1.0.0"],
    connectTimeoutMs: 60000,
    qrTimeout: 60000,
  });

  // Handle connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 QR Code generated - scan with WhatsApp");
      connectionStatus = "waiting_qr";
      try {
        latestQRCode = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error("QR error:", err.message);
      }
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("📴 Connection closed, reason:", reason);

      if (reason === DisconnectReason.loggedOut) {
        console.log("🔒 Logged out - clearing session");
        connectionStatus = "logged_out";
        // Clear auth folder
        if (fs.existsSync(AUTH_FOLDER)) {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        }
      } else {
        connectionStatus = "disconnected";
        // Reconnect after delay
        console.log("🔄 Reconnecting in 5 seconds...");
        setTimeout(() => initialize(), 5000);
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
      connectionStatus = "connected";
      latestQRCode = null;

      // Load groups
      await loadGroups();
    }
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);
}

// Load all groups
async function loadGroups() {
  try {
    const groups = await sock.groupFetchAllParticipating();
    groupList = Object.values(groups).map((g) => ({
      id: g.id,
      name: g.subject,
    }));
    console.log(`📋 Loaded ${groupList.length} groups`);
    groupList.forEach((g) => console.log(`  - ${g.name} => ${g.id}`));
  } catch (err) {
    console.error("Failed to load groups:", err.message);
  }
}

// Get all groups
async function getGroups() {
  if (connectionStatus !== "connected") {
    throw new Error(`Status: ${connectionStatus}`);
  }

  // Refresh group list
  await loadGroups();
  return groupList;
}

// Send message
async function sendMessage(chatId, message) {
  if (connectionStatus !== "connected" || !sock) {
    throw new Error("WhatsApp tidak terhubung");
  }

  try {
    await sock.sendMessage(chatId, { text: message });
    console.log(`✅ Message sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`❌ Send failed:`, error.message);
    throw error;
  }
}

// Get QR Code
function getQRCode() {
  return latestQRCode;
}

// Get connection status
function getConnectionStatus() {
  return connectionStatus;
}

// Logout and clear session
async function logout() {
  if (sock) {
    await sock.logout();
  }
  if (fs.existsSync(AUTH_FOLDER)) {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
  }
  connectionStatus = "disconnected";
  latestQRCode = null;
}

module.exports = {
  initialize,
  sendMessage,
  getQRCode,
  getConnectionStatus,
  getGroups,
  logout,
};

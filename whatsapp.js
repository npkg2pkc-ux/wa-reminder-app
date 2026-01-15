const QRCode = require("qrcode");
const pino = require("pino");
const fs = require("fs");

let baileys = null;
let sock = null;
let latestQRCode = null;
let connectionStatus = "initializing";
let groupList = [];
let isInitializing = false;

const AUTH_FOLDER = "./auth_info";
const logger = pino({ level: "silent" });

// Load baileys dynamically (ESM module)
async function loadBaileys() {
  if (!baileys) {
    baileys = await import("baileys");
  }
  return baileys;
}

// Initialize WhatsApp connection
async function initialize() {
  if (isInitializing) {
    console.log("⚠️ Already initializing...");
    return;
  }

  isInitializing = true;
  connectionStatus = "initializing";

  console.log("🚀 Starting WhatsApp...");

  try {
    // Load baileys
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = await loadBaileys();
    
    // Ensure auth folder exists
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();
    console.log("🔐 Using version:", version);

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      browser: ["Reminder", "Chrome", "1.0"],
    });

    console.log("🔌 Socket created");

    // Handle connection updates
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 QR received!");
        connectionStatus = "waiting_qr";
        try {
          latestQRCode = await QRCode.toDataURL(qr);
          console.log("✅ QR ready");
        } catch (err) {
          console.error("QR error:", err.message);
        }
      }

      if (connection === "close") {
        isInitializing = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log("📴 Closed:", statusCode, "reconnect:", shouldReconnect);

        if (shouldReconnect) {
          connectionStatus = "reconnecting";
          setTimeout(() => initialize(), 3000);
        } else {
          connectionStatus = "logged_out";
          latestQRCode = null;
          if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
          setTimeout(() => initialize(), 3000);
        }
      }

      if (connection === "open") {
        console.log("✅ Connected!");
        connectionStatus = "connected";
        latestQRCode = null;
        isInitializing = false;
        await loadGroups();
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (err) {
    console.error("❌ Init error:", err);
    connectionStatus = "error";
    isInitializing = false;
    setTimeout(() => initialize(), 5000);
  }
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
  } catch (err) {
    console.error("Failed to load groups:", err.message);
  }
}

// Get all groups
async function getGroups() {
  if (connectionStatus !== "connected") {
    throw new Error(`Status: ${connectionStatus}`);
  }
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

function getQRCode() {
  return latestQRCode;
}

function getConnectionStatus() {
  return connectionStatus;
}

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

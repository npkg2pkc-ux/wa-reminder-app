const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const pino = require("pino");
const fs = require("fs");

let sock = null;
let latestQRCode = null;
let connectionStatus = "initializing";
let groupList = [];
let isInitializing = false;

const AUTH_FOLDER = "./auth_info";

// Logger with info level to see what's happening
const logger = pino({ level: "warn" });

// Initialize WhatsApp connection
async function initialize() {
  if (isInitializing) {
    console.log("⚠️ Already initializing...");
    return;
  }
  
  isInitializing = true;
  connectionStatus = "initializing";
  
  console.log("🚀 Starting WhatsApp (Baileys)...");

  try {
    // Ensure auth folder exists
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    console.log("📂 Auth folder ready");
    
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    console.log("🔐 Auth state loaded");
    
    const { version } = await fetchLatestBaileysVersion();
    console.log("📦 Baileys version:", version);

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: true, // Also print in terminal for debugging
      browser: ["Reminder Bot", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      qrTimeout: 40000,
    });

    console.log("🔌 Socket created, waiting for events...");

    // Handle connection updates
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log("📡 Connection update:", { connection, hasQR: !!qr });

      if (qr) {
        console.log("📱 QR Code received!");
        connectionStatus = "waiting_qr";
        try {
          latestQRCode = await QRCode.toDataURL(qr);
          console.log("✅ QR Code converted to base64");
        } catch (err) {
          console.error("❌ QR convert error:", err.message);
        }
      }

      if (connection === "close") {
        isInitializing = false;
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log("📴 Connection closed, reason:", reason);

        if (reason === DisconnectReason.loggedOut) {
          console.log("🔒 Logged out - clearing session");
          connectionStatus = "logged_out";
          latestQRCode = null;
          if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
          // Restart after logout
          setTimeout(() => initialize(), 3000);
        } else {
          connectionStatus = "disconnected";
          console.log("🔄 Reconnecting in 3 seconds...");
          setTimeout(() => initialize(), 3000);
        }
      }

      if (connection === "open") {
        console.log("✅ WhatsApp Connected!");
        connectionStatus = "connected";
        latestQRCode = null;
        isInitializing = false;
        await loadGroups();
      }
    });

    // Save credentials on update
    sock.ev.on("creds.update", saveCreds);
    
  } catch (err) {
    console.error("❌ Initialize error:", err.message);
    connectionStatus = "error";
    isInitializing = false;
    // Retry after error
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

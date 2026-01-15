const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

let latestQRCode = null;
let connectionStatus = "disconnected";
let client = null;

// Create client with memory optimization
function createClient() {
  return new Client({
    authStrategy: new LocalAuth({
      clientId: "reminder-bot",
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI,BlinkGenPropertyTrees",
        "--disable-ipc-flooding-protection",
        "--js-flags=--max-old-space-size=128",
      ],
    },
    qrMaxRetries: 5,
  });
}

// Setup event listeners
function setupEvents() {
  client.on("qr", async (qr) => {
    console.log("📱 QR Code generated");
    connectionStatus = "waiting_qr";
    try {
      latestQRCode = await QRCode.toDataURL(qr);
    } catch (err) {
      console.error("QR error:", err.message);
    }
  });

  client.on("ready", async () => {
    console.log("✅ WhatsApp Connected!");
    connectionStatus = "connected";
    latestQRCode = null;
    
    try {
      const chats = await client.getChats();
      console.log("📋 Groups:");
      chats.filter(c => c.isGroup).forEach(g => {
        console.log(`  - ${g.name} => ${g.id._serialized}`);
      });
    } catch (e) {
      console.log("Could not list groups:", e.message);
    }
  });

  client.on("authenticated", () => {
    console.log("🔐 Authenticated");
    connectionStatus = "authenticated";
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Auth failed:", msg);
    connectionStatus = "auth_failed";
  });

  client.on("disconnected", (reason) => {
    console.log("📴 Disconnected:", reason);
    connectionStatus = "disconnected";
  });
}

// Send message
async function sendMessage(chatId, message) {
  if (connectionStatus !== "connected") {
    throw new Error("WhatsApp tidak terhubung");
  }
  
  try {
    const chat = await client.getChatById(chatId);
    await chat.sendMessage(message);
    console.log(`✅ Message sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`❌ Send failed:`, error.message);
    throw error;
  }
}

// Initialize
async function initialize() {
  console.log("🚀 Starting WhatsApp...");
  client = createClient();
  setupEvents();
  await client.initialize();
}

function getQRCode() {
  return latestQRCode;
}

function getConnectionStatus() {
  return connectionStatus;
}

// Get groups
async function getGroups() {
  if (connectionStatus !== "connected") {
    throw new Error(`Status: ${connectionStatus}`);
  }
  
  const chats = await client.getChats();
  return chats
    .filter(c => c.isGroup)
    .map(g => ({ name: g.name, id: g.id._serialized }));
}

module.exports = {
  initialize,
  sendMessage,
  getQRCode,
  getConnectionStatus,
  getGroups,
};

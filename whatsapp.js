const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

// Initialize WhatsApp client with LocalAuth for persistent session
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "wa-reminder-bot",
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
    ],
  },
});

// Display QR code in terminal for authentication
client.on("qr", async (qr) => {
  const qrImage = await QRCode.toDataURL(qr);
  console.log("📱 Scan QR Code using this link:");
  console.log(qrImage);
});

// Log when client is ready
client.on("ready", async () => {
  console.log("\n========================================");
  console.log("✅ WhatsApp Client is ready!");
  console.log("========================================\n");
  console.log("✅ WhatsApp Client is ready!");

  const chats = await client.getChats();

  console.log("📋 LIST GROUP WHATSAPP:");
  chats
    .filter((chat) => chat.isGroup)
    .forEach((group) => {
      console.log(`- ${group.name} => ${group.id._serialized}`);
    });
});

// Log authentication success
client.on("authenticated", () => {
  console.log("🔐 WhatsApp authentication successful!");
});

// Handle authentication failure
client.on("auth_failure", (message) => {
  console.error("❌ WhatsApp authentication failed:", message);
});

// Handle disconnection
client.on("disconnected", (reason) => {
  console.log("📴 WhatsApp client disconnected:", reason);
  console.log("🔄 Attempting to reconnect...");
  client.initialize();
});

/**
 * Send a message to a WhatsApp group
 * @param {string} groupId - The WhatsApp group ID (format: 1203630xxxxxxxx@g.us)
 * @param {string} message - The message to send
 * @returns {Promise<Object>} - The sent message object
 */
async function sendMessageToGroup(groupId, message) {
  try {
    // Check if client is ready
    const state = await client.getState();
    if (state !== "CONNECTED") {
      throw new Error("WhatsApp client is not connected");
    }

    // Send the message
    const chat = await client.getChatById(groupId);
    const sentMessage = await chat.sendMessage(message);

    console.log(`✅ Message sent to group ${groupId}`);
    return sentMessage;
  } catch (error) {
    console.error(
      `❌ Failed to send message to group ${groupId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Initialize the WhatsApp client
 */
function initializeClient() {
  console.log("🚀 Initializing WhatsApp client...");
  client.initialize();
}

/**
 * Get the WhatsApp client instance
 * @returns {Client} - The WhatsApp client
 */
function getClient() {
  return client;
}

module.exports = {
  client,
  initializeClient,
  sendMessageToGroup,
  getClient,
};

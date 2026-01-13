require("dotenv").config();
const express = require("express");
const path = require("path");

// Initialize Express app FIRST
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

// Health check endpoint - MUST be first
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// QR Code endpoint - shows QR code page for WhatsApp authentication
app.get("/qr", (req, res) => {
  try {
    const whatsapp = require("./whatsapp");
    const qrCode = whatsapp.getQRCode();
    const status = whatsapp.getConnectionStatus();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #128C7E; }
          .status { padding: 10px 20px; border-radius: 20px; margin: 20px 0; display: inline-block; }
          .connected { background: #25D366; color: white; }
          .waiting { background: #FFA500; color: white; }
          .disconnected { background: #DC3545; color: white; }
          img { max-width: 300px; margin: 20px 0; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 WhatsApp Connection</h1>
          <div class="status ${status === 'connected' ? 'connected' : status === 'waiting_qr' ? 'waiting' : 'disconnected'}">
            Status: ${status.toUpperCase().replace('_', ' ')}
          </div>
          ${qrCode ? `
            <div>
              <p>Scan this QR code with WhatsApp:</p>
              <img src="${qrCode}" alt="QR Code">
              <p><small>Page refreshes every 5 seconds</small></p>
            </div>
          ` : status === 'connected' ? `
            <p>✅ WhatsApp is connected!</p>
            <p><a href="/">Go to Dashboard</a></p>
          ` : `
            <p>⏳ Waiting for QR code...</p>
            <p><small>Page refreshes every 5 seconds</small></p>
          `}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 WhatsApp Connection</h1>
          <p>⏳ WhatsApp client is initializing...</p>
          <p><small>Page refreshes every 5 seconds</small></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Start server immediately for healthcheck
const server = app.listen(PORT, HOST, () => {
  console.log(`🌐 Server running on ${HOST}:${PORT}`);
  console.log("✅ Health check endpoint ready at /health");

  // Initialize other services AFTER server is up
  initializeServices();
});

// Lazy load other modules to speed up server start
let initializeClient,
  initializeSheet,
  startScheduler,
  getHolidays,
  reminderRoutes;

async function initializeServices() {
  console.log("\n========================================");
  console.log("🚀 Initializing Services...");
  console.log("========================================\n");

  try {
    // Load modules
    const whatsapp = require("./whatsapp");
    const sheets = require("./sheets");
    const scheduler = require("./scheduler");
    const holidays = require("./holidays");
    reminderRoutes = require("./routes/reminders");

    initializeClient = whatsapp.initializeClient;
    initializeSheet = sheets.initializeSheet;
    startScheduler = scheduler.startScheduler;
    getHolidays = holidays.getHolidays;

    // Add routes after loading
    app.use("/", reminderRoutes);

    // Initialize Google Sheets
    console.log("📊 Initializing Google Sheets...");
    await initializeSheet();
    console.log("✅ Google Sheets initialized\n");

    // Pre-fetch holidays
    console.log("🎌 Loading Indonesian holidays...");
    const year = new Date().getFullYear();
    await getHolidays(year);
    console.log("✅ Holidays data loaded\n");

    // Initialize WhatsApp client
    console.log("📱 Initializing WhatsApp client...");
    initializeClient();

    // Start the scheduler
    startScheduler();

    console.log("\n========================================");
    console.log("✅ All services initialized!");
    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Service initialization error:", error.message);
    console.log("⚠️  Server still running for healthcheck");
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

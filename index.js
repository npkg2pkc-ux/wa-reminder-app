require("dotenv").config();
const express = require("express");
const path = require("path");
const { initializeClient } = require("./whatsapp");
const { initializeSheet } = require("./sheets");
const { startScheduler } = require("./scheduler");
const { getHolidays } = require("./holidays");
const reminderRoutes = require("./routes/reminders");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", reminderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).render("index", {
    title: "WhatsApp Auto Reminder",
    message: null,
    error: "An unexpected error occurred",
    reminders: [],
    upcomingHolidays: [],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start the application
async function startApp() {
  console.log("\n========================================");
  console.log("🚀 Starting WhatsApp Auto Reminder App");
  console.log("========================================\n");

  // Start Express server FIRST (for healthcheck)
  app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
  });

  try {
    // Initialize Google Sheets
    console.log("📊 Initializing Google Sheets...");
    await initializeSheet();
    console.log("✅ Google Sheets initialized\n");

    // Pre-fetch holidays
    console.log("🎌 Pre-fetching Indonesian holidays...");
    const year = new Date().getFullYear();
    await getHolidays(year);
    console.log("✅ Holidays data loaded\n");

    // Initialize WhatsApp client (non-blocking)
    console.log("📱 Initializing WhatsApp client...");
    initializeClient();

    // Start the scheduler
    startScheduler();

    console.log("\n========================================");
    console.log("✅ Application started successfully!");
    console.log("========================================\n");
    console.log("📋 Instructions:");
    console.log("   1. Scan the QR code with WhatsApp (check logs)");
    console.log("   2. Open the web interface in your browser");
    console.log("   3. Configure auto reminders (Friday & Holiday)");
    console.log("   4. System will automatically send messages!\n");
  } catch (error) {
    console.error("❌ Initialization error:", error.message);
    console.log("⚠️  Server still running, some features may not work");
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

// Start the application
startApp();

require("dotenv").config();
const express = require("express");
const path = require("path");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Health check - FIRST
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Initialize WhatsApp and Sheets
let whatsapp = null;
let sheets = null;
let initStarted = false;
let initError = null;

async function init() {
  if (initStarted) return;
  initStarted = true;

  console.log("🔄 Starting initialization...");

  try {
    sheets = require("./sheets");
    await sheets.initializeSheet();
    console.log("✅ Google Sheets ready");
  } catch (err) {
    console.error("❌ Sheets error:", err.message);
  }

  try {
    console.log("📱 Loading WhatsApp module...");
    whatsapp = require("./whatsapp");
    console.log("📱 WhatsApp module loaded, starting...");
    
    whatsapp.initialize().then(() => {
      console.log("✅ WhatsApp initialize() completed");
    }).catch((err) => {
      console.error("❌ WhatsApp init error:", err);
      initError = err.message;
    });
    
    console.log("✅ WhatsApp starting (background)...");
  } catch (err) {
    console.error("❌ WhatsApp require error:", err);
    initError = err.message;
  }
}

// Main page
app.get("/", async (req, res) => {
  try {
    const status = whatsapp ? whatsapp.getConnectionStatus() : "disconnected";
    const qrCode = whatsapp ? whatsapp.getQRCode() : null;
    const reminders = sheets ? await sheets.getReminders() : [];

    res.render("index", {
      status:
        status === "connected"
          ? "connected"
          : qrCode
          ? "waiting_qr"
          : "disconnected",
      qrCode,
      reminders,
    });
  } catch (err) {
    res.render("index", {
      status: "disconnected",
      qrCode: null,
      reminders: [],
    });
  }
});

// API: Get QR code
app.get("/api/qr", (req, res) => {
  try {
    const status = whatsapp ? whatsapp.getConnectionStatus() : "not_loaded";
    const qrCode = whatsapp ? whatsapp.getQRCode() : null;
    res.json({ 
      success: true, 
      status, 
      qrCode,
      initStarted,
      initError,
      whatsappLoaded: !!whatsapp
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Get groups
app.get("/api/groups", async (req, res) => {
  try {
    const status = whatsapp ? whatsapp.getConnectionStatus() : "disconnected";
    if (status !== "connected") {
      return res.json({
        success: false,
        error: "WhatsApp tidak terhubung. Status: " + status,
      });
    }
    const groups = await whatsapp.getGroups();
    res.json({ success: true, groups });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Add reminder
app.post("/api/reminders", async (req, res) => {
  try {
    const { name, send_date, send_time, target_id, message } = req.body;

    if (!send_date || !send_time || !target_id || !message) {
      return res.json({ success: false, error: "Semua field harus diisi" });
    }

    const id = await sheets.addReminder({
      name,
      send_date,
      send_time,
      target_id,
      message,
    });
    res.json({ success: true, id });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Delete reminder
app.delete("/api/reminders/:id", async (req, res) => {
  try {
    await sheets.deleteReminder(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Send reminder now
app.post("/api/reminders/:id/send", async (req, res) => {
  try {
    if (!whatsapp || whatsapp.getConnectionStatus() !== "connected") {
      return res.json({ success: false, error: "WhatsApp tidak terhubung" });
    }

    const reminder = await sheets.getReminder(req.params.id);
    if (!reminder) {
      return res.json({ success: false, error: "Reminder tidak ditemukan" });
    }

    await whatsapp.sendMessage(reminder.target_id, reminder.message);
    await sheets.updateStatus(req.params.id, "sent");

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Test send
app.post("/api/test-send", async (req, res) => {
  try {
    if (!whatsapp || whatsapp.getConnectionStatus() !== "connected") {
      return res.json({ success: false, error: "WhatsApp tidak terhubung" });
    }

    const { targetId, message } = req.body;
    if (!targetId || !message) {
      return res.json({
        success: false,
        error: "targetId dan message diperlukan",
      });
    }

    await whatsapp.sendMessage(targetId, message);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Scheduler: Check every minute
cron.schedule(
  "* * * * *",
  async () => {
    if (!whatsapp || whatsapp.getConnectionStatus() !== "connected") {
      return;
    }

    try {
      const now = new Date();
      const jakartaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );

      const todayStr = jakartaTime.toISOString().split("T")[0]; // YYYY-MM-DD
      const hours = String(jakartaTime.getHours()).padStart(2, "0");
      const minutes = String(jakartaTime.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      console.log(`⏰ [${todayStr} ${currentTime}] Checking reminders...`);

      const reminders = await sheets.getReminders();

      for (const r of reminders) {
        if (r.status !== "pending") continue;
        if (r.send_date !== todayStr) continue;
        if (r.send_time !== currentTime) continue;

        console.log(`📤 Sending reminder: ${r.name || r.id}`);

        try {
          await whatsapp.sendMessage(r.target_id, r.message);
          await sheets.updateStatus(r.id, "sent");
          console.log(`✅ Sent: ${r.id}`);
        } catch (err) {
          console.error(`❌ Failed: ${r.id}`, err.message);
          await sheets.updateStatus(r.id, "failed");
        }
      }
    } catch (err) {
      console.error("❌ Scheduler error:", err.message);
    }
  },
  {
    timezone: "Asia/Jakarta",
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  init();
});

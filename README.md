# WhatsApp Auto Reminder Application

A free web-based automatic reminder application that sends scheduled messages to WhatsApp Groups using WhatsApp Web automation and Google Sheets as the database. Supports **automatic Friday reminders** and **Indonesian national holiday reminders**.

## 🌟 Features

- 📱 WhatsApp Web integration via whatsapp-web.js
- 📊 Google Sheets as free database
- ⏰ Automatic scheduling with node-cron
- 📅 **Friday Auto Reminder** - Sends every Friday at configured time
- 🎌 **Holiday Auto Reminder** - Sends 1 day before Indonesian national holidays
- 🕐 Asia/Jakarta timezone support
- 🔐 Persistent WhatsApp session with LocalAuth
- 🌐 Clean web interface for configuration
- 🚫 No manual date selection required!

## 📁 Project Structure

```
wa-reminder-app/
├── index.js          # Main server file
├── whatsapp.js       # WhatsApp client setup
├── scheduler.js      # Cron job scheduler with Friday & Holiday logic
├── sheets.js         # Google Sheets integration
├── holidays.js       # Indonesian holiday API integration
├── routes/
│   └── reminders.js  # API routes
├── views/
│   └── index.ejs     # Frontend template
├── public/
│   └── style.css     # Styling
├── .env              # Environment variables
└── package.json      # Dependencies
```

## 🔧 How It Works

### Friday Reminder

- System automatically detects when it's Friday
- At the configured trigger time (e.g., 08:00 WIB)
- Sends the reminder message to the specified WhatsApp group
- Only sends once per Friday (tracked via `last_sent` column)

### Holiday Reminder

- Fetches Indonesian national holidays from free API (date.nager.at)
- Holiday data is cached for the entire year
- Checks daily if tomorrow is a national holiday
- At the configured trigger time, sends reminder 1 day BEFORE the holiday
- Message includes the holiday name automatically

## 📊 Google Sheets Structure

The app uses a sheet named `AutoReminders` with these columns:

| Column       | Description          | Example                                |
| ------------ | -------------------- | -------------------------------------- |
| id           | Unique identifier    | FRI-ABC123                             |
| message      | Reminder message     | Jangan lupa...                         |
| group_id     | WhatsApp group ID    | 123456@g.us                            |
| trigger_time | Time to send (HH:mm) | 08:00                                  |
| type         | Reminder type        | friday_auto / holiday_auto             |
| rule         | Schedule rule        | every_friday / before_national_holiday |
| last_sent    | Last sent date       | 2024-01-12                             |
| enabled      | Active status        | true / false                           |

## 🚀 Prerequisites

1. **Node.js** (v16 or higher)
2. **Google Cloud Project** with Google Sheets API enabled
3. **Google Service Account** with credentials
4. **WhatsApp Account** to be used as the bot

## 📋 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**
4. Go to **Credentials** → Create **Service Account**
5. Download the JSON key file

### Step 2: Create Google Sheet

1. Create a new Google Spreadsheet
2. The app will automatically create a sheet named `AutoReminders`
3. Share the spreadsheet with your service account email (with **Editor** access)
4. Copy the Spreadsheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`

### Step 3: Configure Environment Variables

Edit the `.env` file with your credentials:

```env
PORT=3000
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Note:** Copy the `private_key` from your downloaded JSON file. Keep the `\n` characters as they are.

### Step 4: Install Dependencies

```bash
cd wa-reminder-app
npm install
```

### Step 5: Run the Application

```bash
npm start
```

### Step 6: Authenticate WhatsApp

1. When the app starts, a QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code
5. Wait for "WhatsApp Client is ready!" message

### Step 7: Configure Auto Reminders

1. Open `http://localhost:3000` in your browser
2. Fill in the form:
   - **Message**: Your reminder message
   - **Trigger Time**: Time to send (e.g., 08:00)
   - **WhatsApp Group ID**: Target group ID
3. Select reminder types:
   - ✅ Friday Reminder
   - ✅ Holiday Reminder
4. Click "Create Auto Reminder"
5. Done! The system handles everything automatically.

## 🔍 Getting WhatsApp Group ID

Add this code temporarily in `whatsapp.js` after the `ready` event:

```javascript
client.on("ready", async () => {
  const chats = await client.getChats();
  chats.forEach((chat) => {
    if (chat.isGroup) {
      console.log(`Group: ${chat.name} - ID: ${chat.id._serialized}`);
    }
  });
});
```

The group ID format is: `1234567890@g.us`

## 🎌 Holiday API

Indonesian holidays are fetched from:

- **API**: https://date.nager.at/api/v3/PublicHolidays/{year}/ID
- **Free**: No API key required
- **Cached**: Fetched once per year for efficiency
- **Filtered**: Only national public holidays (not observances)

## 🛠️ Troubleshooting

### QR Code not appearing

- Make sure no other WhatsApp Web session is active
- Delete the `.wwebjs_auth` folder and restart

### Google Sheets error

- Verify the service account email has Editor access
- Check if GOOGLE_PRIVATE_KEY has proper `\n` formatting
- Ensure Google Sheets API is enabled

### Messages not sending

- Ensure the bot WhatsApp account has joined the target group
- Verify Group ID format ends with `@g.us`
- Check console logs for errors
- Verify trigger_time format is HH:mm (24-hour)

### Wrong timezone

- The app uses Asia/Jakarta (WIB) timezone
- All times are in 24-hour format

## ⚠️ Important Notes

- This uses unofficial WhatsApp automation
- WhatsApp may block accounts sending too many automated messages
- Use responsibly and follow WhatsApp's Terms of Service
- The bot account must already be a member of target groups
- Reminders are sent only ONCE per event (tracked by last_sent)

## 📜 License

MIT License

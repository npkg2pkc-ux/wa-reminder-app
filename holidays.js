// Indonesian National Holidays Data
// Data libur nasional Indonesia yang sudah diverifikasi

// Cache for holiday data
let holidayCache = {
  year: null,
  holidays: [],
};

const INDONESIAN_HOLIDAYS = {
  2025: [
    {
      date: "2025-01-01",
      localName: "Tahun Baru Masehi",
      name: "New Year's Day",
    },
    {
      date: "2025-01-29",
      localName: "Tahun Baru Imlek",
      name: "Chinese New Year",
    },
    { date: "2025-02-12", localName: "Isra Mi'raj", name: "Isra and Mi'raj" },
    { date: "2025-03-29", localName: "Hari Raya Nyepi", name: "Nyepi" },
    { date: "2025-03-31", localName: "Idul Fitri", name: "Eid al-Fitr" },
    {
      date: "2025-04-01",
      localName: "Idul Fitri",
      name: "Eid al-Fitr Holiday",
    },
    { date: "2025-04-18", localName: "Wafat Isa Almasih", name: "Good Friday" },
    {
      date: "2025-05-01",
      localName: "Hari Buruh Internasional",
      name: "Labour Day",
    },
    { date: "2025-05-12", localName: "Hari Raya Waisak", name: "Vesak" },
    {
      date: "2025-05-29",
      localName: "Kenaikan Isa Almasih",
      name: "Ascension Day",
    },
    {
      date: "2025-06-01",
      localName: "Hari Lahir Pancasila",
      name: "Pancasila Day",
    },
    { date: "2025-06-07", localName: "Idul Adha", name: "Eid al-Adha" },
    {
      date: "2025-06-27",
      localName: "Tahun Baru Islam",
      name: "Islamic New Year",
    },
    {
      date: "2025-08-17",
      localName: "Hari Kemerdekaan",
      name: "Independence Day",
    },
    {
      date: "2025-09-05",
      localName: "Maulid Nabi Muhammad",
      name: "Prophet's Birthday",
    },
    { date: "2025-12-25", localName: "Hari Natal", name: "Christmas Day" },
  ],
  2026: [
    {
      date: "2026-01-01",
      localName: "Tahun Baru Masehi",
      name: "New Year's Day",
    },
    {
      date: "2026-01-16",
      localName: "Isra Mi'raj",
      name: "Isra and Mi'raj",
    },
    {
      date: "2026-02-17",
      localName: "Tahun Baru Imlek",
      name: "Chinese New Year",
    },
    { date: "2026-03-19", localName: "Hari Raya Nyepi", name: "Nyepi" },
    { date: "2026-03-20", localName: "Idul Fitri", name: "Eid al-Fitr" },
    {
      date: "2026-03-21",
      localName: "Idul Fitri",
      name: "Eid al-Fitr Holiday",
    },
    { date: "2026-04-03", localName: "Wafat Isa Almasih", name: "Good Friday" },
    { date: "2026-04-05", localName: "Paskah", name: "Easter Sunday" },
    {
      date: "2026-05-01",
      localName: "Hari Buruh Internasional",
      name: "Labour Day",
    },
    { date: "2026-05-13", localName: "Hari Raya Waisak", name: "Vesak" },
    {
      date: "2026-05-14",
      localName: "Kenaikan Isa Almasih",
      name: "Ascension Day",
    },
    { date: "2026-05-27", localName: "Idul Adha", name: "Eid al-Adha" },
    {
      date: "2026-06-01",
      localName: "Hari Lahir Pancasila",
      name: "Pancasila Day",
    },
    {
      date: "2026-06-17",
      localName: "Tahun Baru Islam",
      name: "Islamic New Year",
    },
    {
      date: "2026-08-17",
      localName: "Hari Kemerdekaan",
      name: "Independence Day",
    },
    {
      date: "2026-08-26",
      localName: "Maulid Nabi Muhammad",
      name: "Prophet's Birthday",
    },
    { date: "2026-12-25", localName: "Hari Natal", name: "Christmas Day" },
  ],
  2027: [
    {
      date: "2027-01-01",
      localName: "Tahun Baru Masehi",
      name: "New Year's Day",
    },
    {
      date: "2027-02-06",
      localName: "Tahun Baru Imlek",
      name: "Chinese New Year",
    },
    { date: "2027-01-21", localName: "Isra Mi'raj", name: "Isra and Mi'raj" },
    { date: "2027-03-09", localName: "Hari Raya Nyepi", name: "Nyepi" },
    { date: "2027-03-10", localName: "Idul Fitri", name: "Eid al-Fitr" },
    {
      date: "2027-03-11",
      localName: "Idul Fitri",
      name: "Eid al-Fitr Holiday",
    },
    { date: "2027-03-26", localName: "Wafat Isa Almasih", name: "Good Friday" },
    { date: "2027-05-01", localName: "Hari Buruh", name: "Labour Day" },
    {
      date: "2027-05-06",
      localName: "Kenaikan Isa Almasih",
      name: "Ascension Day",
    },
    { date: "2027-05-16", localName: "Idul Adha", name: "Eid al-Adha" },
    { date: "2027-05-20", localName: "Hari Raya Waisak", name: "Vesak" },
    {
      date: "2027-06-01",
      localName: "Hari Lahir Pancasila",
      name: "Pancasila Day",
    },
    {
      date: "2027-06-06",
      localName: "Tahun Baru Islam",
      name: "Islamic New Year",
    },
    {
      date: "2027-08-15",
      localName: "Maulid Nabi Muhammad",
      name: "Prophet's Birthday",
    },
    {
      date: "2027-08-17",
      localName: "Hari Kemerdekaan",
      name: "Independence Day",
    },
    { date: "2027-12-25", localName: "Hari Natal", name: "Christmas Day" },
  ],
};

/**
 * Get holidays with caching (using local data - no API calls)
 * @param {number} year - The year to get holidays for
 * @returns {Promise<Array>} - Array of holiday objects
 */
async function getHolidays(year) {
  // Return cached data if available for the same year
  if (holidayCache.year === year && holidayCache.holidays.length > 0) {
    return holidayCache.holidays;
  }

  // Use local data directly (more reliable, no network errors)
  const holidays = getLocalHolidays(year);

  // Update cache
  if (holidays.length > 0) {
    holidayCache = {
      year: year,
      holidays: holidays,
    };
  }

  return holidays;
}

/**
 * Get local holidays for a specific year
 * @param {number} year - The year to get holidays for
 * @returns {Array} - Array of holiday objects
 */
function getLocalHolidays(year) {
  if (INDONESIAN_HOLIDAYS[year]) {
    console.log(
      `📅 Loaded ${INDONESIAN_HOLIDAYS[year].length} holidays for ${year}`
    );
    return INDONESIAN_HOLIDAYS[year];
  }

  // If year not in data, return empty
  console.log(`⚠️ No holiday data available for ${year}`);
  return [];
}

/**
 * Check if a specific date is a weekend (Saturday or Sunday)
 * @param {Date} date - Date object
 * @returns {boolean} - True if weekend
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a specific date is a national holiday
 * @param {Date} date - Date object
 * @param {Array} holidays - Array of holiday objects
 * @returns {Object|null} - Holiday object if date is a holiday, null otherwise
 */
function isNationalHoliday(date, holidays) {
  const dateStr = formatDateYYYYMMDD(date);
  return holidays.find((h) => h.date === dateStr) || null;
}

/**
 * Check if tomorrow starts a holiday period (holiday or weekend connected to holiday)
 * This function checks if:
 * 1. Today is a working day (not weekend, not holiday)
 * 2. Tomorrow is a national holiday, OR
 * 3. Tomorrow is weekend AND there's a national holiday connected to it
 *
 * For type "holiday_auto" with rule "before_national_holiday":
 * - Reminder is sent 1 working day before a national holiday
 * - If the holiday connects with weekend (e.g., Friday holiday + Sat/Sun),
 *   reminder is sent on Thursday
 *
 * @param {Date} today - Today's date (in Jakarta timezone)
 * @returns {Promise<Object|null>} - Holiday info if reminder should be sent, null otherwise
 */
async function checkTomorrowHoliday(today) {
  try {
    const year = today.getFullYear();
    const todayStr = formatDateYYYYMMDD(today);

    console.log(
      `🔍 Checking holiday reminder for today: ${todayStr} (${getDayName(
        today
      )})`
    );

    // Get holidays for current and next year
    const holidays = await getHolidays(year);
    let allHolidays = [...holidays];

    // Also fetch next year if near end of year
    if (today.getMonth() >= 10) {
      const nextYearHolidays = await getHolidays(year + 1);
      allHolidays = [...allHolidays, ...nextYearHolidays];
    }

    // Check if TODAY is already a weekend or holiday - if so, don't send reminder
    if (isWeekend(today)) {
      console.log(`📅 Today (${todayStr}) is weekend, no reminder needed`);
      return null;
    }

    const todayHoliday = isNationalHoliday(today, allHolidays);
    if (todayHoliday) {
      console.log(
        `📅 Today (${todayStr}) is already a holiday (${todayHoliday.localName}), no reminder needed`
      );
      return null;
    }

    // Look for the upcoming holiday period starting from tomorrow
    // Check if there's a national holiday in the next few days that starts tomorrow or connects via weekend
    const upcomingHoliday = findUpcomingHolidayPeriod(today, allHolidays);

    if (upcomingHoliday) {
      return upcomingHoliday;
    }

    console.log(`📅 No upcoming holiday period found, no reminder needed`);
    return null;
  } catch (error) {
    console.error("❌ Error checking tomorrow holiday:", error.message);
    return null;
  }
}

/**
 * Find if there's an upcoming holiday period starting tomorrow
 * This handles cases like:
 * - Tomorrow is a national holiday
 * - Tomorrow is weekend and there's a holiday on Monday (long weekend)
 * - Tomorrow is Friday holiday, followed by weekend
 *
 * @param {Date} today - Today's date
 * @param {Array} allHolidays - Array of all holidays
 * @returns {Object|null} - Holiday info if found
 */
function findUpcomingHolidayPeriod(today, allHolidays) {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateYYYYMMDD(tomorrow);

  console.log(
    `🔍 Checking if ${tomorrowStr} (${getDayName(
      tomorrow
    )}) starts a holiday period...`
  );

  // Case 1: Tomorrow is a national holiday
  const tomorrowHoliday = isNationalHoliday(tomorrow, allHolidays);
  if (tomorrowHoliday) {
    console.log(
      `🎉 Tomorrow (${tomorrowStr}) is a NATIONAL HOLIDAY: ${tomorrowHoliday.localName}`
    );
    return tomorrowHoliday;
  }

  // Case 2: Tomorrow is weekend - check if there's a holiday connected
  if (isWeekend(tomorrow)) {
    // Look ahead through the weekend and beyond to find connected holidays
    const connectedHoliday = findConnectedHoliday(tomorrow, allHolidays);

    if (connectedHoliday) {
      console.log(
        `🎉 Tomorrow (${tomorrowStr}) is ${getDayName(
          tomorrow
        )}, connected to holiday: ${connectedHoliday.localName} on ${
          connectedHoliday.date
        }`
      );
      return {
        date: tomorrowStr,
        localName: `Akhir Pekan + ${connectedHoliday.localName}`,
        name: `Weekend connected to ${connectedHoliday.name}`,
        isWeekend: true,
        connectedHoliday: connectedHoliday,
      };
    }

    // Regular weekend (Saturday) - ALSO send reminder for weekend
    // This ensures reminder is sent every Friday before Saturday-Sunday
    console.log(
      `📅 Tomorrow (${tomorrowStr}) is ${getDayName(
        tomorrow
      )} - regular weekend, sending reminder`
    );
    return {
      date: tomorrowStr,
      localName: "Akhir Pekan (Sabtu-Minggu)",
      name: "Weekend",
      isWeekend: true,
      isRegularWeekend: true,
    };
  }

  // Tomorrow is a regular working day
  console.log(`📅 Tomorrow (${tomorrowStr}) is a regular working day`);
  return null;
}

/**
 * Get day name in English
 * @param {Date} date - Date object
 * @returns {string} - Day name
 */
function getDayName(date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

/**
 * Find if there's a national holiday connected to a weekend
 * Looks ahead from the given date to find holidays within the same period
 * @param {Date} startDate - Starting date (should be a weekend day)
 * @param {Array} holidays - Array of holiday objects
 * @returns {Object|null} - Connected holiday if found
 */
function findConnectedHoliday(startDate, holidays) {
  // Look ahead up to 7 days to find connected holidays
  for (let i = 0; i <= 7; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);

    const holiday = isNationalHoliday(checkDate, holidays);
    if (holiday) {
      return holiday;
    }

    // If we hit a working day (not weekend, not holiday), stop looking
    if (!isWeekend(checkDate) && !holiday) {
      break;
    }
  }
  return null;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDateYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get upcoming holidays for display
 * @param {number} limit - Number of holidays to return
 * @returns {Promise<Array>} - Array of upcoming holidays
 */
async function getUpcomingHolidays(limit = 5) {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const todayStr = formatDateYYYYMMDD(today);

    // Get this year and next year holidays
    const thisYearHolidays = await getHolidays(year);
    const nextYearHolidays = await getHolidays(year + 1);

    const allHolidays = [...thisYearHolidays, ...nextYearHolidays];

    // Filter upcoming holidays
    const upcoming = allHolidays
      .filter((h) => h.date >= todayStr)
      .slice(0, limit);

    return upcoming;
  } catch (error) {
    console.error("❌ Error getting upcoming holidays:", error.message);
    return [];
  }
}

/**
 * Clear the holiday cache (useful for testing or manual refresh)
 */
function clearHolidayCache() {
  holidayCache = {
    year: null,
    holidays: [],
  };
  console.log("🗑️ Holiday cache cleared");
}

module.exports = {
  getHolidays,
  checkTomorrowHoliday,
  formatDateYYYYMMDD,
  getUpcomingHolidays,
  clearHolidayCache,
  isWeekend,
  isNationalHoliday,
  getDayName,
};

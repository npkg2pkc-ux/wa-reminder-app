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
 * Check if tomorrow is a national holiday
 * @param {Date} today - Today's date (in Jakarta timezone)
 * @returns {Promise<Object|null>} - Holiday object if tomorrow is a holiday, null otherwise
 */
async function checkTomorrowHoliday(today) {
  try {
    // Calculate tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const tomorrowStr = formatDateYYYYMMDD(tomorrow);

    console.log(`🔍 Checking if ${tomorrowStr} is a holiday...`);

    // Get holidays for the year
    const holidays = await getHolidays(year);

    // Also check next year if we're near year end
    let allHolidays = [...holidays];
    if (tomorrow.getMonth() === 0 && today.getMonth() === 11) {
      // Tomorrow is January but today is December - need next year's holidays
      const nextYearHolidays = await getHolidays(year);
      allHolidays = [...allHolidays, ...nextYearHolidays];
    }

    // Find if tomorrow is a holiday
    const holiday = allHolidays.find((h) => h.date === tomorrowStr);

    if (holiday) {
      console.log(
        `🎉 Tomorrow (${tomorrowStr}) is a holiday: ${holiday.localName}`
      );
      return holiday;
    }

    console.log(`📅 Tomorrow (${tomorrowStr}) is not a holiday`);
    return null;
  } catch (error) {
    console.error("❌ Error checking tomorrow holiday:", error.message);
    return null;
  }
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
};

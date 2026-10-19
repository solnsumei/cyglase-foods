/**
 * Utility functions for evaluating vendor operating hours and order acceptance status.
 * Operating hours are evaluated in West Africa Time (WAT, UTC+1 - Nigeria).
 */

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface DaySchedule {
  day: DayOfWeek;
  isOpen: boolean;
  opensAt: string; // "HH:MM"
  closesAt: string; // "HH:MM"
}

/**
 * Parses vendor.opening_days into a structured 7-day schedule.
 * Supports legacy formats (["Monday", "Tuesday", ...]) and day-specific hours ("Monday:08:00-22:00", "Sunday:closed").
 */
export function parseDaySchedules(
  openingDays?: string[] | null,
  defaultOpenTime: string = "08:00",
  defaultCloseTime: string = "22:00"
): DaySchedule[] {
  const normOpen = defaultOpenTime ? defaultOpenTime.slice(0, 5) : "08:00";
  const normClose = defaultCloseTime ? defaultCloseTime.slice(0, 5) : "22:00";
  const rawList = openingDays && openingDays.length > 0 ? openingDays : [...DAYS_OF_WEEK];

  return DAYS_OF_WEEK.map((day) => {
    const entry = rawList.find(
      (item) =>
        item.toLowerCase() === day.toLowerCase() ||
        item.toLowerCase().startsWith(`${day.toLowerCase()}:`)
    );

    if (!entry) {
      return { day, isOpen: false, opensAt: normOpen, closesAt: normClose };
    }

    if (entry.includes(":")) {
      const parts = entry.split(":");
      const rest = parts.slice(1).join(":"); // "08:00-22:00" or "closed"
      if (rest.toLowerCase() === "closed") {
        return { day, isOpen: false, opensAt: normOpen, closesAt: normClose };
      }
      const [o, c] = rest.split("-");
      return {
        day,
        isOpen: true,
        opensAt: o ? o.trim().slice(0, 5) : normOpen,
        closesAt: c ? c.trim().slice(0, 5) : normClose,
      };
    }

    // Plain day string (legacy e.g. "Monday")
    return {
      day,
      isOpen: true,
      opensAt: normOpen,
      closesAt: normClose,
    };
  });
}

/**
 * Serializes day schedules back into string[] for database storage in vendors.opening_days
 */
export function formatDaySchedules(schedules: DaySchedule[]): string[] {
  return schedules.map((s) => {
    if (!s.isOpen) {
      return `${s.day}:closed`;
    }
    return `${s.day}:${s.opensAt}-${s.closesAt}`;
  });
}

function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Returns current minute of the day (0 - 1439) in Africa/Lagos time (WAT, UTC+1)
 */
export function getCurrentNigeriaMinutes(): number {
  return getCurrentNigeriaDayAndMinutes().minutes;
}

/**
 * Returns current day of week and minute of the day in Africa/Lagos time (WAT, UTC+1)
 */
export function getCurrentNigeriaDayAndMinutes(): {
  dayName: DayOfWeek;
  minutes: number;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const rawDay = parts.find((p) => p.type === "weekday")?.value;
    const hourPart = parts.find((p) => p.type === "hour")?.value;
    const minPart = parts.find((p) => p.type === "minute")?.value;
    const h = parseInt(hourPart || "0", 10);
    const m = parseInt(minPart || "0", 10);
    const matchedDay =
      DAYS_OF_WEEK.find((d) => d.toLowerCase() === rawDay?.toLowerCase()) ||
      "Monday";
    return {
      dayName: matchedDay,
      minutes: (h % 24) * 60 + m,
    };
  } catch {
    const map: DayOfWeek[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = map[now.getUTCDay()];
    const watHours = (now.getUTCHours() + 1) % 24;
    return {
      dayName,
      minutes: watHours * 60 + now.getUTCMinutes(),
    };
  }
}

/**
 * Checks whether current time is within vendor's scheduled opening and closing hours.
 */
export function isWithinOperatingHours(
  openingTime?: string | null,
  closingTime?: string | null,
  nowMinutes: number = getCurrentNigeriaMinutes()
): boolean {
  const openM = parseTimeToMinutes(openingTime);
  const closeM = parseTimeToMinutes(closingTime);

  // If opening/closing time is unconfigured, assume within hours
  if (openM === null || closeM === null) {
    return true;
  }

  // 24-hour kitchen (same open and close)
  if (openM === closeM) {
    return true;
  }

  // Standard daytime schedule (e.g. 08:00 to 22:00)
  if (closeM > openM) {
    return nowMinutes >= openM && nowMinutes < closeM;
  }

  // Overnight schedule (e.g. 18:00 to 03:00 next morning)
  return nowMinutes >= openM || nowMinutes < closeM;
}

/**
 * Converts "08:00:00" or "19:30" to "8:00 AM" or "7:30 PM"
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return "";
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mStr} ${period}`;
}

export interface VendorDisplayHours {
  isOpenToday: boolean;
  isPastOpenTime: boolean;
  isPastCloseTime: boolean;
  displayText: string;
  opensAtFormatted: string;
  closesAtFormatted: string;
  dayName: DayOfWeek;
}

/**
 * Evaluates the appropriate opening/closing text for users viewing a vendor.
 * Rules:
 * - Shows current day's hours in Nigerian time (WAT).
 * - If vendor is closed today -> "Closed Today"
 * - If current time is past opening time -> shows only closing time, e.g. "Closes at 10:00 PM"
 * - If current time is before opening time -> shows both opening and closing time, e.g. "Today: 8:00 AM - 10:00 PM"
 * - If current time is past closing time -> shows "Closed (Closed at 10:00 PM)"
 */
export function getVendorDisplayHours(
  vendor?: {
    opening_time?: string | null;
    closing_time?: string | null;
    opening_days?: string[] | null;
  } | null
): VendorDisplayHours {
  const { dayName, minutes: nowMinutes } = getCurrentNigeriaDayAndMinutes();
  const schedules = parseDaySchedules(
    vendor?.opening_days,
    vendor?.opening_time || "08:00",
    vendor?.closing_time || "22:00"
  );
  const todaySchedule = schedules.find((s) => s.day === dayName);

  if (!todaySchedule || !todaySchedule.isOpen) {
    return {
      isOpenToday: false,
      isPastOpenTime: false,
      isPastCloseTime: false,
      displayText: "Closed Today",
      opensAtFormatted: "",
      closesAtFormatted: "",
      dayName,
    };
  }

  const openMinutes = parseTimeToMinutes(todaySchedule.opensAt) ?? 8 * 60;
  const closeMinutes = parseTimeToMinutes(todaySchedule.closesAt) ?? 22 * 60;
  const opensAtFormatted = formatTime12Hour(todaySchedule.opensAt);
  const closesAtFormatted = formatTime12Hour(todaySchedule.closesAt);

  const isPastOpenTime = nowMinutes >= openMinutes;
  const isPastCloseTime =
    closeMinutes > openMinutes
      ? nowMinutes >= closeMinutes
      : nowMinutes >= closeMinutes && nowMinutes < openMinutes;

  let displayText: string;

  if (isPastCloseTime) {
    displayText = `Closed (Closed at ${closesAtFormatted})`;
  } else if (isPastOpenTime) {
    // If the time is past opening time, show only the closing time
    displayText = `Closes at ${closesAtFormatted}`;
  } else {
    // Before opening time: show both opening and closing time
    displayText = `Today: ${opensAtFormatted} - ${closesAtFormatted}`;
  }

  return {
    isOpenToday: true,
    isPastOpenTime,
    isPastCloseTime,
    displayText,
    opensAtFormatted,
    closesAtFormatted,
    dayName,
  };
}

export interface VendorEffectiveStatus {
  isAcceptingOrders: boolean; // TRUE only if within hours AND is_open === true
  isWithinHours: boolean;
  isOpenToggle: boolean; // raw is_open boolean
  status: "accepting" | "paused" | "closed_hours";
  badgeText: string;
  subtext: string;
  todaySchedule?: DaySchedule;
  displayHours: VendorDisplayHours;
}

/**
 * Evaluates whether a vendor is currently taking orders on the customer side.
 * Checks:
 * - Manual pause toggle (is_open)
 * - Whether kitchen is scheduled to be open on today's day of week (closed on some days)
 * - Whether current time is within today's opening and closing hours
 */
export function getVendorLiveStatus(
  vendor?: {
    is_open?: boolean | null;
    opening_time?: string | null;
    closing_time?: string | null;
    opening_days?: string[] | null;
  } | null
): VendorEffectiveStatus {
  const displayHours = getVendorDisplayHours(vendor);

  if (!vendor) {
    return {
      isAcceptingOrders: false,
      isWithinHours: false,
      isOpenToggle: false,
      status: "closed_hours",
      badgeText: "Closed",
      subtext: "Kitchen is closed",
      displayHours,
    };
  }

  const isOpenToggle = Boolean(vendor.is_open);

  // 1. Manual kitchen toggle off -> Paused
  if (!isOpenToggle) {
    return {
      isAcceptingOrders: false,
      isWithinHours: true,
      isOpenToggle: false,
      status: "paused",
      badgeText: "Orders Paused",
      subtext: "Kitchen is temporarily not accepting orders",
      displayHours,
    };
  }

  // 2. Evaluate Nigeria time day and minutes
  const { dayName, minutes } = getCurrentNigeriaDayAndMinutes();
  const schedules = parseDaySchedules(
    vendor.opening_days,
    vendor.opening_time || "08:00",
    vendor.closing_time || "22:00"
  );
  const todaySchedule = schedules.find((s) => s.day === dayName);

  // If vendor is closed on this day of the week
  if (!todaySchedule || !todaySchedule.isOpen) {
    const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
    let nextOpenDay: DaySchedule | undefined;
    for (let i = 1; i <= 7; i++) {
      const candidate = schedules[(dayIndex + i) % 7];
      if (candidate && candidate.isOpen) {
        nextOpenDay = candidate;
        break;
      }
    }

    return {
      isAcceptingOrders: false,
      isWithinHours: false,
      isOpenToggle,
      status: "closed_hours",
      badgeText: "Closed Today",
      subtext: nextOpenDay
        ? `Closed on ${dayName}s • Opens ${nextOpenDay.day} ${formatTime12Hour(nextOpenDay.opensAt)}`
        : `Closed on ${dayName}s`,
      todaySchedule,
      displayHours,
    };
  }

  // 3. Vendor is open today, check if currently within today's hours
  const isWithinHours = isWithinOperatingHours(
    todaySchedule.opensAt,
    todaySchedule.closesAt,
    minutes
  );

  if (!isWithinHours) {
    const opensAt = formatTime12Hour(todaySchedule.opensAt);
    return {
      isAcceptingOrders: false,
      isWithinHours: false,
      isOpenToggle,
      status: "closed_hours",
      badgeText: "Closed",
      subtext: opensAt ? `Opens at ${opensAt}` : "Outside opening hours",
      todaySchedule,
      displayHours,
    };
  }

  // 4. Within hours and open
  const closesAt = formatTime12Hour(todaySchedule.closesAt);
  return {
    isAcceptingOrders: true,
    isWithinHours: true,
    isOpenToggle: true,
    status: "accepting",
    badgeText: "Open for Orders",
    subtext: closesAt ? `Closes at ${closesAt}` : "Taking orders now",
    todaySchedule,
    displayHours,
  };
}

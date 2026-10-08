/**
 * Utility functions for evaluating vendor operating hours and order acceptance status.
 * Operating hours are evaluated in West Africa Time (WAT, UTC+1 - Nigeria).
 */

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
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour")?.value;
    const minPart = parts.find((p) => p.type === "minute")?.value;
    const h = parseInt(hourPart || "0", 10);
    const m = parseInt(minPart || "0", 10);
    return (h % 24) * 60 + m;
  } catch {
    // Fallback: UTC + 1 hour (60 minutes)
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const watHours = (utcHours + 1) % 24;
    return watHours * 60 + utcMinutes;
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

export interface VendorEffectiveStatus {
  isAcceptingOrders: boolean; // TRUE only if within hours AND is_open === true
  isWithinHours: boolean;
  isOpenToggle: boolean; // raw is_open boolean
  status: "accepting" | "paused" | "closed_hours";
  badgeText: string;
  subtext: string;
}

/**
 * Evaluates whether a vendor is currently taking orders on the customer side.
 * - If outside operating hours -> automatically closed
 * - If within operating hours:
 *     is_open = true  -> Accepting Orders
 *     is_open = false -> Paused / Not Taking Orders
 */
export function getVendorLiveStatus(
  vendor?: {
    is_open?: boolean | null;
    opening_time?: string | null;
    closing_time?: string | null;
  } | null
): VendorEffectiveStatus {
  if (!vendor) {
    return {
      isAcceptingOrders: false,
      isWithinHours: false,
      isOpenToggle: false,
      status: "closed_hours",
      badgeText: "Closed",
      subtext: "Kitchen is closed",
    };
  }

  const isWithinHours = isWithinOperatingHours(
    vendor.opening_time,
    vendor.closing_time
  );
  const isOpenToggle = Boolean(vendor.is_open);

  // 1. Outside scheduled operating hours -> Automatically closed
  if (!isWithinHours) {
    const opensAt = formatTime12Hour(vendor.opening_time);
    return {
      isAcceptingOrders: false,
      isWithinHours: false,
      isOpenToggle,
      status: "closed_hours",
      badgeText: "Closed",
      subtext: opensAt ? `Opens at ${opensAt}` : "Outside opening hours",
    };
  }

  // 2. Within hours, but vendor toggled orders off -> Paused
  if (!isOpenToggle) {
    return {
      isAcceptingOrders: false,
      isWithinHours: true,
      isOpenToggle: false,
      status: "paused",
      badgeText: "Orders Paused",
      subtext: "Kitchen is temporarily not accepting orders",
    };
  }

  // 3. Within hours and vendor is accepting orders -> Open
  const closesAt = formatTime12Hour(vendor.closing_time);
  return {
    isAcceptingOrders: true,
    isWithinHours: true,
    isOpenToggle: true,
    status: "accepting",
    badgeText: "Open for Orders",
    subtext: closesAt ? `Closes at ${closesAt}` : "Taking orders now",
  };
}

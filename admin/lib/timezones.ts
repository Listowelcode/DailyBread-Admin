// Global timezone helpers used by the signup form and subscriber profile.
//
// The signup form lets a subscriber pick the timezone their Daily Bread
// emails should be sent in. Every subscriber's delivery time (Today's Word,
// Journey emails) is computed against *their own* chosen zone, so two
// subscribers who both picked "9:00 AM" receive their message at 9:00 AM in
// their own timezone, not the admin's. The admin's own default timezone
// (used for scheduling announcements and as the fallback delivery clock)
// defaults to GMT — an announcement sent from the admin goes out at the
// same instant for every subscriber regardless of their personal timezone.

export const DEFAULT_TIMEZONE = "UTC";

export interface TimezoneOption {
  value: string;
  label: string;
}

function offsetLabel(timeZone: string, referenceDate: Date): { minutes: number; label: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    }).formatToParts(referenceDate);
    const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
    const match = offsetPart.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
    const hours = match ? Number(match[1]) : 0;
    const mins = match?.[2] ? Number(match[2]) : 0;
    const minutes = hours * 60 + (hours < 0 ? -mins : mins);
    const sign = minutes <= 0 ? "-" : "+";
    const abs = Math.abs(minutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return { minutes, label: `GMT${sign}${hh}:${mm}` };
  } catch {
    return { minutes: 0, label: "GMT+00:00" };
  }
}

// Fallback list used only if the browser doesn't support
// Intl.supportedValuesOf("timeZone") (older Safari/browsers).
const FALLBACK_ZONES = [
  "UTC", "Africa/Accra", "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/New_York",
  "America/Sao_Paulo", "America/Toronto", "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong",
  "Asia/Jakarta", "Asia/Jerusalem", "Asia/Kolkata", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo", "Australia/Melbourne", "Australia/Perth",
  "Australia/Sydney", "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Istanbul",
  "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Paris", "Europe/Rome",
  "Pacific/Auckland", "Pacific/Honolulu",
];

function friendlyCityName(zone: string): string {
  if (zone === "UTC") return "Coordinated Universal Time";
  const parts = zone.split("/");
  const city = parts[parts.length - 1] ?? zone;
  return city.replaceAll("_", " ");
}

/**
 * Returns every IANA timezone the browser knows about (or a broad fallback
 * list), labeled with its current GMT offset and sorted west-to-east — the
 * same "GMT-11:00 ... GMT+00:00 ... GMT+14:00" ordering used by most signup
 * forms, so it feels native to whichever site it's dropped into.
 */
export function getTimezoneOptions(referenceDate: Date = new Date()): TimezoneOption[] {
  let zones: string[];
  try {
    zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : FALLBACK_ZONES;
  } catch {
    zones = FALLBACK_ZONES;
  }
  if (!zones.includes("UTC")) zones = ["UTC", ...zones];

  const options = zones.map((zone) => {
    const { minutes, label } = offsetLabel(zone, referenceDate);
    return {
      value: zone,
      minutes,
      label: zone === "UTC" ? `${label} — Universal (UTC)` : `${label} — ${friendlyCityName(zone)}`,
    };
  });

  options.sort((a, b) => a.minutes - b.minutes || a.label.localeCompare(b.label));
  return options.map(({ value, label }) => ({ value, label }));
}

/**
 * Good morning / afternoon / evening greeting for whatever the local clock
 * reads in the given IANA timezone right now.
 */
export function getGreeting(timeZone: string | null | undefined, referenceDate: Date = new Date()): string {
  let hour = referenceDate.getUTCHours();
  if (timeZone) {
    try {
      const hourString = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(referenceDate);
      hour = Number(hourString);
    } catch {
      // Unknown/invalid timezone — fall back to UTC hour computed above.
    }
  }
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

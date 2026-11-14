export function formatLocalDate(date: Date | string, timezone: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  const validZone = (() => { try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return timezone; } catch { return "Asia/Dhaka"; } })();
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: validZone }).format(new Date(date));
}

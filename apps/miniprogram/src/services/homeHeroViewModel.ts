export function formatBeijingDateTime(date = new Date()): string {
  const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const month = beijingDate.getUTCMonth() + 1;
  const day = beijingDate.getUTCDate();
  const weekday = weekdayLabels[beijingDate.getUTCDay()];
  const hour = String(beijingDate.getUTCHours()).padStart(2, "0");
  const minute = String(beijingDate.getUTCMinutes()).padStart(2, "0");

  return `${month}月${day}日 ${weekday} ${hour}:${minute}`;
}

export const cityOptions = ["上海", "北京", "杭州", "成都", "深圳", "广州"];

export function getCityFromPickerIndex(index: number | string): string {
  const numericIndex = typeof index === "number" ? index : Number.parseInt(index, 10);

  return cityOptions[Number.isInteger(numericIndex) ? numericIndex : 0] ?? cityOptions[0];
}

export function getCityPickerIndex(city: string): number {
  const index = cityOptions.indexOf(city);

  return index >= 0 ? index : 0;
}

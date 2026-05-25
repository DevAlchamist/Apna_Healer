import { Prisma } from "@prisma/client";

export const PLATFORM_FEE_RATE = 0.15;

export function toDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

export function mergeDateAndTime(date: Date, time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  const result = new Date(date);
  result.setHours(Number(hours), Number(minutes), 0, 0);
  return result;
}

export const getTimeNumberString = (): string => {
  // Get UTC timestamp and add 7 hours (7 * 60 * 60 * 1000 milliseconds)
  const vietnamTimestamp = Date.now() + (7 * 60 * 60 * 1000);
  return vietnamTimestamp.toString();
};

export const toVietnamISOString = (date: Date | null | undefined): string => {
  if (!date) {
    return "";
  }
  
  // Get UTC timestamp in milliseconds
  const utcTimestamp = date.getTime();
  
  // Add 7 hours (7 * 60 * 60 * 1000 milliseconds) to convert to Vietnam timezone (UTC+7)
  const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
  
  // Create new Date from Vietnam timestamp and convert to ISO string
  const vietnamDate = new Date(vietnamTimestamp);
  
  return vietnamDate.toISOString();
};

export const calculateAge = (dateOfBirth: Date | null | undefined): number => {
  if (!dateOfBirth) {
    return 0;
  }
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const getZonedDateParts = (date: Date, timeZone: string): ZonedDateParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const parts = getZonedDateParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
  return (asUtc - date.getTime()) / 60000;
};

const zonedTimeToUtc = (
  parts: ZonedDateParts & { millisecond?: number },
  timeZone: string
): Date => {
  const utcDate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond ?? 0
    )
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(utcDate, timeZone);
  return new Date(utcDate.getTime() - offsetMinutes * 60000);
};

export const getUtcDayRangeForTimeZone = (
  base:
    | Date
    | {
        year: number;
        month: number;
        day: number;
      },
  timeZone: string
): { startUtc: Date; endUtc: Date } => {
  const parts =
    base instanceof Date
      ? getZonedDateParts(base, timeZone)
      : {
          year: base.year,
          month: base.month,
          day: base.day,
          hour: 0,
          minute: 0,
          second: 0,
        };

  const startUtc = zonedTimeToUtc(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone
  );

  const endUtc = zonedTimeToUtc(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    },
    timeZone
  );

  return { startUtc, endUtc };
};


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


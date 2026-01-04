import { prisma } from "../config/database.config";
import { getTimeNumberString } from "./date.util";
import { BaseError } from "./base-error.util";

export async function generatePatientCode(clinicId: string): Promise<string> {
  // Get clinic code from database
  const clinic = await prisma.clinic.findUnique({
    where: { clinicId: clinicId },
    select: { clinicCode: true },
  });

  if (!clinic || !clinic.clinicCode) {
    throw new BaseError(404, "Clinic code not found");
  }

  // Get time number string and take last 4 digits
  const timeString = getTimeNumberString();
  const lastFourDigits = timeString.slice(-4);

  // Combine clinic code + last 4 digits
  const patientCode = `${clinic.clinicCode}${lastFourDigits}`;

  // Ensure uniqueness
  let existing = await prisma.patient.findUnique({
    where: { patientCode: patientCode },
  });

  let finalCode = patientCode;
  let counter = 1;
  
  while (existing) {
    // If code exists, append a counter to make it unique
    finalCode = `${clinic.clinicCode}${lastFourDigits}${counter}`;
    existing = await prisma.patient.findUnique({
      where: { patientCode: finalCode },
    });
    counter++;
  }

  return finalCode;
}

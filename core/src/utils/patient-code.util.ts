import { prisma } from "../config/database.config";
import { getTimeNumberString } from "./date.util";
import { BaseError } from "./base-error.util";

export async function generatePatientCode(clinicCode: string): Promise<string> {
  // Get clinic code from database
  // if (!clinicId) {
  //   throw new BaseError(400, "Clinic ID is required to generate patient code");
  // }
  // const clinic = await prisma.clinic.findUnique({
  //   where: { clinicId: clinicId },
  //   select: { clinicCode: true },
  // });

  // if (!clinic || !clinic.clinicCode) {
  //   throw new BaseError(404, "Clinic code not found");
  // }

  // Get time number string and take last 4 digits
  const timeString = getTimeNumberString();
  const lastFourDigits = timeString.slice(-4);

  // Combine clinic code + last 4 digits
  const patientCode = `${clinicCode}${lastFourDigits}`;

  // Ensure uniqueness
  let existing = await prisma.patient.findFirst({
    where: { patientCode: patientCode, isDeleted: false },
  });

  let finalCode = patientCode;
  let counter = 1;
  
  while (existing) {
    // If code exists, append a counter to make it unique
    finalCode = `${clinicCode}${lastFourDigits}${counter}`;
    existing = await prisma.patient.findFirst({
      where: { patientCode: finalCode, isDeleted: false },
    });
    counter++;
  }

  return finalCode;
}

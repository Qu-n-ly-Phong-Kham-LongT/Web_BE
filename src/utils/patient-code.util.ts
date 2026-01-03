import { prisma } from "../config/database.config";

export async function generatePatientCode(): Promise<string> {
  let lastPatient = await prisma.patient.findFirst({
    where: {
      PatientCode: {
        startsWith: "HS",
      },
    },
    orderBy: { CreatedAt: "desc" },
    select: { PatientCode: true },
  });

  let nextNumber = 1;
  if (lastPatient?.PatientCode) {
    let match = lastPatient.PatientCode.match(/^HS(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  let newCode = `HS${String(nextNumber).padStart(6, "0")}`;
  
  // Ensure uniqueness
  let existing = await prisma.patient.findUnique({
    where: { PatientCode: newCode },
  });
  
  while (existing) {
    nextNumber++;
    newCode = `HS${String(nextNumber).padStart(6, "0")}`;
    existing = await prisma.patient.findUnique({
      where: { PatientCode: newCode },
    });
  }

  return newCode;
}

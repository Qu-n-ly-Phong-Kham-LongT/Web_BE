import { prisma } from "../config/database.config";

export async function generatePatientCode(): Promise<string> {
  let lastPatient = await prisma.patient.findFirst({
    where: {
      patientCode: {
        startsWith: "HS",
      },
    },
    orderBy: { createdAt: "desc" },
    select: { patientCode: true },
  });

  let nextNumber = 1;
  if (lastPatient?.patientCode) {
    let match = lastPatient.patientCode.match(/^HS(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  let newCode = `HS${String(nextNumber).padStart(6, "0")}`;
  
  // Ensure uniqueness
  let existing = await prisma.patient.findUnique({
    where: { patientCode: newCode },
  });
  
  while (existing) {
    nextNumber++;
    newCode = `HS${String(nextNumber).padStart(6, "0")}`;
    existing = await prisma.patient.findUnique({
      where: { patientCode: newCode },
    });
  }

  return newCode;
}

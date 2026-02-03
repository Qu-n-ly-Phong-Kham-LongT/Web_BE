import fs from "fs";
import path from "path";
import { generateBarcodeBuffer } from "../src/utils/barcode.util";

const outputName = process.argv[2] || "barcode-test.png";
const outputPath = path.resolve(process.cwd(), outputName);
const text = process.argv[3] || "TEST-123456";

const run = async () => {
  const buffer = await generateBarcodeBuffer(text);
  fs.writeFileSync(outputPath, buffer);
  // eslint-disable-next-line no-console
  console.log(`OK -> ${outputPath}`);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to generate barcode:", error);
  process.exit(1);
});

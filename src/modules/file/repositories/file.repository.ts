import { prisma } from "../../../config/database.config";

export class FileRepository {
  public async createFileRecord(data: {
    RelativePath: string;
    Type: string;
    MimeType: string;
    Size: number;
  }) {
    return await prisma.file.create({
      data,
    });
  }

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    await prisma.file.deleteMany({
      where: {
        RelativePath: relativePath,
      },
    });
  }
}

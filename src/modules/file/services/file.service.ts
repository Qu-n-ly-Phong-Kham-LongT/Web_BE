import { FileType } from "../../../constants/file-type.constant";

export class FileService {
  public async uploadFile(): Promise<any> {
    return { type: FileType.TEMP_FILE };
  }
}
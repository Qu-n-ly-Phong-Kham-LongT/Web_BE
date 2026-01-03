export interface UserEntity {
  id: string;
  username: string;
  fullname: string;
  password: string;
  email?: string | null;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
}

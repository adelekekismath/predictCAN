export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
}

export type Role = 'STUDENT' | 'TEACHER' | 'COORDINATOR' | 'PARENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  specialty?: string;
  department?: string;
  phoneContact?: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  enabled: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
  profileId: number | null;
}
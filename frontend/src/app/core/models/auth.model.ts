export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  fullName: string;
  role: 'ROLE_ADMIN' | 'ROLE_RECEPTIONIST' | 'ROLE_MECHANIC' | string;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: string;
}


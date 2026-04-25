export interface RegisterRequest {
  email: string;
  fullName: string;
  phone: string;
  location: string;
}

export interface RegisterResponse {
  email: string;
  fullName: string;
  userId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken?: string;
  refreshToken?: string;
}

export interface CurrentUser {
  userId?: string;
  email?: string;
  role?: string;
}
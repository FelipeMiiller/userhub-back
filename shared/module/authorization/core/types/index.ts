export interface Payload {
  email: string;
  sub: string;
  role: string;
  status: boolean;
}

export interface Login {
  accessToken: string;
  refreshToken: string;
}

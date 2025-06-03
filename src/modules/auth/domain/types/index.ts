export interface GoogleProfile {
  id: string;
  displayName: string;
  email: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified?: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
  provider: 'google';
  _raw: string;
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
  };
}

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

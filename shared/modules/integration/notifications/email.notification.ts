export enum EmailTemplates {
  PASSWORD_RESET = 'user.password.reset',
  ACCOUNT_ACTIVATION = 'user.account.activation',
  WELCOME_EMAIL = 'user.welcome.email',
}

export type WelcomeNotification = {
  email: string;
  name: string;
};

export type PasswordResetNotification = {
  email: string;
  name: string;
  resetToken: string;
};

export type AccountActivationNotification = {
  email: string;
  name: string;
  activationToken: string;
};

export type EmailNotificationPayload = {
  payload: WelcomeNotification | PasswordResetNotification | AccountActivationNotification;
  template: EmailTemplates;
};

export enum MailTemplates {
  RESET_PASSWORD = 'reset-password',
  WELCOME = 'welcome',
}

export type TemplateName = keyof typeof MailTemplates;

export enum MailTemplates {
  /**
   * Template for password reset emails
   * @see reset-password.hbs
   */
  RESET_PASSWORD = 'reset-password',

  /**
   * Template for welcome emails
   * @see welcome.hbs
   */
  WELCOME = 'welcome',
}

export type TemplateName = keyof typeof MailTemplates;

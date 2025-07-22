export class ResetPasswordEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly newPassword: string,
  ) {}
}

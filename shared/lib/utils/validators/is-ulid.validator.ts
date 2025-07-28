import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValid as isValidULID } from 'ulid';

@ValidatorConstraint({ async: false })
export class IsULIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }
    return isValidULID(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'O campo ($value) deve ser um ULID válido.';
  }
}

export function IsULID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsULIDConstraint,
    });
  };
}

import { randomBytes, randomInt } from 'crypto';

export function generateRandomPassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const randomLower = lowercase[randomInt(0, lowercase.length)];
  const randomUpper = uppercase[randomInt(0, uppercase.length)];
  const randomNumber = numbers[randomInt(0, numbers.length)];
  const randomSpecial = special[randomInt(0, special.length)];
  const allChars = lowercase + uppercase + numbers + special;
  const remainingLength = length - 4;

  let password = '';
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[randomInt(0, allChars.length)];
  }

  password += randomLower + randomUpper + randomNumber + randomSpecial;
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

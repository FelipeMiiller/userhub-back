import { randomInt } from 'crypto';

const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const ALL = Object.values(CHARSETS).join('');

function randomChar(set: string): string {
  return set[randomInt(set.length)];
}

function secureShuffle(arr: string[]): string[] {
  // Fisher–Yates usando crypto
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRandomPassword(length = 12): string {
  if (length < 4) {
    throw new Error('Password length must be >= 4');
  }

  const password: string[] = [
    randomChar(CHARSETS.lower),
    randomChar(CHARSETS.upper),
    randomChar(CHARSETS.number),
    randomChar(CHARSETS.special),
  ];

  for (let i = password.length; i < length; i++) {
    password.push(randomChar(ALL));
  }

  return secureShuffle(password).join('');
}

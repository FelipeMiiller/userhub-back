import { Reflector } from '@nestjs/core';
import { Roles } from 'src/modules/users/domain/models/users.models';

export const userRolesArray = Object.keys(Roles)
  .filter((key) => Number.isNaN(Number(key))) // Remove índices numéricos se enum for numérico
  .map((key) => Roles[key]);

export const RolesGuards = Reflector.createDecorator<(typeof userRolesArray)[number][]>();

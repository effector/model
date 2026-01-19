import { keyval, union } from '@effector-model/core-experimental';
import { guestModel } from './guest.model';
import { memberModel } from './member.model';

export const userUnion = union({
  guest: guestModel,
  member: memberModel,
});

export const usersList = keyval({
  model: userUnion,
});

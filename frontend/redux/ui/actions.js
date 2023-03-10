import Api from '../../library/api';
import types from './types';

export const toggleUserRegistration = (userRegistration) => ({
  type: types.USER_REGISTRATION,
  userRegistration
});


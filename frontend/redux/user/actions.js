import Api from '../../library/api';
import types from './types';

export const getUsers = (data) => ({
  type: types.GET_USERS,
  promise: Api.post('/users', data)
});

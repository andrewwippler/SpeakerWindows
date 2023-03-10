import Api from '../../library/api';
import types from './types';

export const login = (data) => ({
  type: types.LOGIN,
  promise: Api.post('/login', data)
});

export const register = (data) => ({
  type: types.LOGIN,
  promise: Api.post('/register', data)
});

export const logout = () => ({
  type: types.LOGOUT,
  promise: Api.delete('/logout')
});

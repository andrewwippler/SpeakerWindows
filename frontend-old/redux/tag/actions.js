import Api from '../../library/api';
import types from './types';

export const getIllustrations = (data) => ({
  type: types.LOGIN,
  promise: Api.get(`/tags/${data}`)
});


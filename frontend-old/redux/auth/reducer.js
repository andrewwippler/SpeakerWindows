import types from './types';
import Router from 'next/router';
import { setCookie, removeCookie } from '../../library/helpers/session';
import {get} from "lodash";


const initState = {
  idToken: null,
  error: null,
};

const authReducer = (state = initState, action) => {
  switch (action.type) {
    case `${types.LOGIN}_SUCCESS`:
      const token = get(action, 'data.token');
      //Set the token to a cookie
      setCookie('token', token);
      //Router the user to the dashboard
      Router.replace('/dashboard');
      return {
        ...state, idToken: action.token
      };
    case `${types.REGISTER}_FAILURE`:
    case `${types.LOGOUT}_FAILURE`:
    case `${types.LOGIN}_FAILURE`:
      return {
        ...state,
        idToken: null,
        error: action.message,
      };
    case `${types.LOGOUT}_SUCCESS`:
      //remove the cookie
      removeCookie('token');
      //Router the user to login
      Router.replace('/');
      return initState;
    default:
      return state;
  }
}

export default authReducer;


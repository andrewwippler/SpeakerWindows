import {combineReducers} from 'redux';
import types from './types';


const toggleUserRegistrationForm = (state = false, action) => {
  switch (action.type) {
    case `${types.USER_REGISTRATION}`:
      return action.userRegistration;

    default:
      return state;
  }
}

export default combineReducers({
  toggleUserRegistrationForm,
});

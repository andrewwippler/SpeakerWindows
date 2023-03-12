import {combineReducers} from 'redux';
import types from './types';

const initState = {
  error: null,
};

const authReducer = (state = initState, action) => {
  switch (action.type) {
    case `${types.TAG}_SUCCESS`:
      return assign({}, { data: action.data, success: true });
    case `${types.TAG}_FAILURE`:
      return assign({}, state, { error: true, errorMessage: action.errorMessage });
    default:
      return state;
  }
}

export default combineReducers({
  authReducer,
});

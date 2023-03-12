import {combineReducers} from 'redux';
import types from './types';
import {assign} from "lodash";


const initState = {
  data: null,
  success: null,
  error: null,
};

const all = (state = initState, action) => {
  switch (action.type) {
    case `${types.GET_USERS}_SUCCESS`:
      return assign({}, {
        data: action.data,
        success: true,
        error: null
      });
    case `${types.GET_USERS}_FAILURE`:
      return assign({}, {
        data: [],
        success: null,
        error: action.errorMessage,
      });
    default:
      return state;
  }
}

export default combineReducers({
  all,
});

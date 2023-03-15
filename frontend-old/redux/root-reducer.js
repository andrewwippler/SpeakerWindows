import { combineReducers } from 'redux';
import { HYDRATE } from 'next-redux-wrapper';
import Auth from '../redux/auth/reducer';
import users from '../redux/user/reducer';
import tag from '../redux/tag/reducer';
import ui from '../redux/ui/reducer';

const appReducer = combineReducers({
  Auth,
  tag,
  ui,
  users
});

const rootReducer = (state, action) => {
  if (action.type === HYDRATE) {
    const nextState = {
      ...state, // use previous state
      ...action.payload, // apply delta from hydration
    };
    if (state.count) nextState.count = state.count; // preserve count value on client side navigation
    return nextState;
  } else {
    return appReducer(state, action);
  }
};

export default rootReducer;

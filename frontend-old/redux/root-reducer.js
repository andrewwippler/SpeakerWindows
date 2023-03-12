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

let hydrated = false;
const rootReducer = (state, action) => {
  switch (action.type) {
    case HYDRATE:
      /**
       * Each time when pages that have getStaticProps or getServerSideProps are opened by user the HYDRATE action
       * will be dispatched. This may happen during initial page load and during regular page navigation.
       * The payload of this action will contain the state at the moment of static generation or server side
       * rendering, so your reducer must merge it with existing client state properly.
       * https://github.com/kirill-konshin/next-redux-wrapper#state-reconciliation-during-hydration
       *
       * Given that we don't currently use the Redux store in getStaticProps or getServerSideProps,
       * we can ignore this action after the first hydrate.
       */
      if (!hydrated) {
        hydrated = typeof window !== 'undefined';
        return {
          ...state,
          ...action.payload
        };
      }
      return state;
    default:
      return appReducer(state, action);
  }
};

export default rootReducer;

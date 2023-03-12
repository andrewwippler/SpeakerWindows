import { createStore, applyMiddleware } from 'redux';
import { createWrapper } from 'next-redux-wrapper';
import rootReducer from './root-reducer';
import middlewares from '../middlewares';

const bindMiddleware = middleware => {
  if (process.env.NODE_ENV !== 'production') {
    const { composeWithDevTools } = require('redux-devtools-extension');
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return applyMiddleware(...middleware);
};

function makeStore(initialState = {}) {
  return createStore(
    rootReducer,
    initialState,
    bindMiddleware(middlewares)
  );
}

export const reduxWrapper = createWrapper(makeStore);

import {
  configureStore,

} from '@reduxjs/toolkit';

import { createStore, applyMiddleware, combineReducers } from 'redux'
import {createWrapper, HYDRATE} from 'next-redux-wrapper';
import thunkMiddleware from 'redux-thunk'

import rootReducer from '../redux/root-reducer';

const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== 'production') {
    const { composeWithDevTools } = require('redux-devtools-extension')
    return composeWithDevTools(applyMiddleware(...middleware))
  }
  return applyMiddleware(...middleware)
}

// create a makeStore function
const makeStore = context => createStore(rootReducer, bindMiddleware([thunkMiddleware]));

// export an assembled wrapper
export const wrapper = createWrapper(makeStore, {debug: true});

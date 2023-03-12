import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import promiseMiddleware from './promise.js';

const loggerMiddleware = createLogger();

const middlewares = [
  thunk,
  promiseMiddleware,
  loggerMiddleware
];

export default middlewares;
'use strict';

export default function promiseMiddleware() {
  return next => action => {
    const {
      promise,
      type,
      ...rest
    } = action;
    if (!promise) return next(action);

    const SUCCESS = type + '_SUCCESS';
    const REQUEST = type + '_REQUEST';
    const FAILURE = type + '_FAILURE';

    next({
      ...rest,
      type: REQUEST
    });

    return promise
      .then(res => {
        return res
      })
      .then(json => {
        if (json.error) {
          next({
            ...rest,
            errorMessage: json.error,
            type: FAILURE
          });
          return false;
        } else {
          next({
            ...rest,
            data: json,
            type: SUCCESS
          });
          return true;
        }
      })
      .catch(errorMessage => {
        next({
          ...rest,
          errorMessage,
          type: FAILURE
        });
        return false;
      });
  };
}
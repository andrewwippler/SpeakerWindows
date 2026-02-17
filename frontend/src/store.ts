import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'

import userReducer from './features/user/reducer'
import tagReducer from './features/tags/reducer'
import modalReducer from './features/modal/reducer'
import flashReducer from './features/flash/reducer'
import uiReducer from './features/ui/reducer'
import recentlyViewedReducer from './features/recentlyViewed/reducer'

export function makeStore() {
  return configureStore({
    reducer: {
      user: userReducer,
      tags: tagReducer,
      modal: modalReducer,
      flash: flashReducer,
      ui: uiReducer,
      recentlyViewed: recentlyViewedReducer,
    },
    devTools: true,
  })
}

const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>

export default store

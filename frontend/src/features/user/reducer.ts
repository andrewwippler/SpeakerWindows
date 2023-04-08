import api from '@/library/api'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetchSettings } from './settingsAPI'
import { settingsType } from '@/library/settingsType'

import type { AppState, AppThunk } from '../../store'

export interface UserState {
  apitoken: string
  settings: settingsType
}

const initialState: UserState = {
  apitoken: '',
  settings: {
    place: '',
    location: '',
  }
}

export const userReducer = createSlice({
  name: 'user',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    getToken: (state) => {
      state.apitoken
    },
    setToken: (state, actions) => {
      state.apitoken = actions.payload
    },
    setSettings: (state, actions) => {
      state.settings = actions.payload[0] // comes in with an array
    },
  },
})

export const selectToken = (state: AppState) => state.user.apitoken
export const getSettings = (state: AppState) => state.user.settings
export const { setToken, getToken, setSettings } = userReducer.actions

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const getThunkSettings =
    (token: string | undefined) : AppThunk =>
    async (dispatch, getState) => {
      const currentValue = getSettings(getState())
      if (currentValue.place == '' && !!token) {
        const settings = await api.get("/settings", '', token)
        dispatch(setSettings(settings))
      }
  }

export default userReducer.reducer

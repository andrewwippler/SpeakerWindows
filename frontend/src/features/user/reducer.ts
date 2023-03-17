import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '../../store'

export interface UserState {
  apitoken: string
}

const initialState: UserState = {
  apitoken: '',
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
      // console.log("dispatch",state.apitoken, actions.payload)
      state.apitoken = actions.payload
    },
  },
})

export const selectToken = (state: AppState) => state.user.apitoken
export const { setToken, getToken } = userReducer.actions

export default userReducer.reducer

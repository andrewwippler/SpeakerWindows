import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '@/store'
import { useAppSelector, useAppDispatch } from '@/hooks'

export interface flashState {
  show: boolean
  object: {
    message: string,
    severity: string,
  }
}

const initialState: flashState = {
  show: false,
  object: {
    message: '',
    severity: '',
  }
}

export const flashReducer = createSlice({
  name: 'flash',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setFlash: (state, actions) => {
      // console.log("flash",state.show, actions.payload)
      state.show = actions.payload
    },
    setFlashMessage: (state, actions) => {
      // console.log("flash",state.show, actions.payload)
      state.show = true
      state.object = actions.payload
    },
  },


})
export const selectFlash = (state: AppState) => state.flash.show
export const selectFlashMessage = (state: AppState) => state.flash.object

export const { setFlash, setFlashMessage } = flashReducer.actions

export default flashReducer.reducer

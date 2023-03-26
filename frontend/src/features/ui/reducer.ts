import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '@/store'

export interface UIState {
  illustrationEdit: boolean
  updateUI: boolean
}

const initialState: UIState = {
  illustrationEdit: false,
  updateUI: false
}

export const uiReducer = createSlice({
  name: 'ui',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setIllustrationEdit: (state, actions) => {
      state.illustrationEdit = actions.payload
    },
    setUpdateUI: (state, actions) => {
      state.updateUI = actions.payload
    },
  },


})
export const selectIllustrationEdit = (state: AppState) => state.ui.illustrationEdit
export const selectUpdateUI = (state: AppState) => state.ui.updateUI

export const { setIllustrationEdit, setUpdateUI } = uiReducer.actions

export default uiReducer.reducer

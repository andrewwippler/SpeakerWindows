import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '@/store'
import { useAppSelector, useAppDispatch } from '@/hooks'

export interface ModalState {
  show: boolean
}

const initialState: ModalState = {
  show: false,
}

export const modalReducer = createSlice({
  name: 'modal',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setModal: (state, actions) => {
      state.show = actions.payload
    },
  },


})
export const selectModal = (state: AppState) => state.modal.show

export const { setModal } = modalReducer.actions

export default modalReducer.reducer

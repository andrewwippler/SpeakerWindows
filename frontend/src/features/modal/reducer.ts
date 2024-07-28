import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '@/store'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { illustrationType, UploadType } from '@/library/illustrationType'
import { placeType } from '@/library/placeType'
import { toDeleteType } from '@/library/toDeleteType'

export interface ModalState {
  itemToDelete: toDeleteType
  show: boolean
}

const initialState: ModalState = {
  show: false,
  itemToDelete: {
    path: "",
    message: "",
    title: "",
    delete_name: "",
    redirect: false
  }
}

export const modalReducer = createSlice({
  name: 'modal',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setModal: (state, actions) => {
      state.show = actions.payload
    },
    setThingToDelete: (state, actions) => {
      state.itemToDelete = actions.payload
    },
  },


})
export const selectModal = (state: AppState) => state.modal.show
export const thingToDelete = (state: AppState) => state.modal.itemToDelete


export const { setModal, setThingToDelete } = modalReducer.actions

export default modalReducer.reducer

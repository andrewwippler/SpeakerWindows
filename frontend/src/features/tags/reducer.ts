import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { AppState, AppThunk } from '@/store'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectToken } from '../user/reducer'
import { HYDRATE } from "next-redux-wrapper";

export interface TagState {
  tags: Array<object>
}

const initialState: TagState = {
  tags: [],
}


async function fetchTags(): Promise<{ data: Array<object> }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_HOST_URL}/tags`, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + useAppSelector(selectToken),
      'Content-Type': 'application/json',
    },
  })
  const result = await response.json()

  return result
}

export const tagReducer = createSlice({
  name: 'tag',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    getTags: (state) => {
      state.tags = fetchTags()
    },
  },
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.auth,
      };
    },
  },

})


export const { getTags } = tagReducer.actions

export default tagReducer.reducer

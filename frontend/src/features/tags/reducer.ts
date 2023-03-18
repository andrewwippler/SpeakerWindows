import { createSlice } from '@reduxjs/toolkit'

import type { AppState } from '@/store'

export interface TagState {
  tags: Array<object>
}

const initialState: TagState = {
  tags: [],
}

export const tagReducer = createSlice({
  name: 'tag',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setTags: (state, actions) => {
      state.tags = actions.payload
    },
  },

})
export const getTags = (state: AppState) => state.tags

export const { setTags } = tagReducer.actions

export default tagReducer.reducer

import { createSlice } from '@reduxjs/toolkit'

import type { AppState } from '@/store'
import { tagType } from '@/library/tagtype'

export interface TagState {
  tags: tagType[]
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
    addTag: (state, actions) => {
      state.tags.push(actions.payload)
    },
    removeTag: (state, actions) => {
      state.tags = state.tags.filter(item => item.name !== actions.payload)
    },
  },

})
export const getTags = (state: AppState) => state.tags.tags

export const getFormattedTags = (state: AppState) => { return state.tags.tags.map(tag => { return tag.name }) }

export const { setTags, addTag, removeTag } = tagReducer.actions

export default tagReducer.reducer
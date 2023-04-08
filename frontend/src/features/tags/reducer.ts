import { createSlice } from '@reduxjs/toolkit'
import { HYDRATE } from 'next-redux-wrapper';
import type { AppState } from '@/store'
import { tagType } from '@/library/tagtype'
import _ from 'lodash'

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
      // Remove duplicate tags, must include space to - conversion
      if (!state.tags) {
        state.tags = [actions.payload]
        return
      }
      if (!state.tags.some(item => item.name === actions.payload.name.replace(/ /g, '-'))) {
        state.tags = [...state.tags, actions.payload]
      }

    },
    removeTag: (state, actions) => {
      state.tags = state.tags.filter(item => item.name !== actions.payload)
    },
  },
})
export const getTags = (state: AppState) => state.tags.tags

export const getFormattedTags = (state: AppState) => {
  if (state.tags.tags) {
    return state.tags.tags.map(tag => { return tag.name })
  }
  return null
}

export const { setTags, addTag, removeTag } = tagReducer.actions

export default tagReducer.reducer

import { createSlice, createSelector } from '@reduxjs/toolkit'
import { HYDRATE } from 'next-redux-wrapper';
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
      state.tags = Array.isArray(state.tags) ? state.tags.filter(item => item.name !== actions.payload) : []
    },
  },
})
export const getTags = (state: AppState) => state.tags.tags

export const getFormattedTags = createSelector(
  [getTags],
  (tags) => {
    if (tags && tags.length > 0) {
      return tags.map(tag => tag.name)
    }
    return null
  }
)

export const { setTags, addTag, removeTag } = tagReducer.actions

export default tagReducer.reducer

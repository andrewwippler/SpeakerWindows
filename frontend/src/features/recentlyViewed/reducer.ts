import { createSlice } from '@reduxjs/toolkit'
import type { AppState } from '@/store'

export interface RecentlyViewedItem {
  id: number
  title: string
  content: string
  accessedAt: string
}

export interface RecentlyViewedState {
  illustrations: RecentlyViewedItem[]
}

const initialState: RecentlyViewedState = {
  illustrations: [],
}

const MAX_ITEMS = 50

export const recentlyViewedReducer = createSlice({
  name: 'recentlyViewed',
  initialState,
  reducers: {
    addIllustration: (state, action) => {
      const { id, title, content } = action.payload

      const existingIndex = state.illustrations.findIndex(
        (ill) => ill.id === id
      )

      const newItem: RecentlyViewedItem = {
        id,
        title,
        content,
        accessedAt: new Date().toISOString(),
      }

      if (existingIndex !== -1) {
        state.illustrations.splice(existingIndex, 1)
      }

      state.illustrations.unshift(newItem)

      if (state.illustrations.length > MAX_ITEMS) {
        state.illustrations = state.illustrations.slice(0, MAX_ITEMS)
      }
    },
    clear: (state) => {
      state.illustrations = []
    },
  },
})

export const selectRecentlyViewed = (state: AppState) =>
  state.recentlyViewed.illustrations

export const { addIllustration, clear } = recentlyViewedReducer.actions

export default recentlyViewedReducer.reducer

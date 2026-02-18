import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { settingsType } from '@/library/settingsType'

import type { AppState, AppThunk } from '../../store'

const INVITATIONS_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

export interface Invitation {
  id: number
  teamId: number
  teamName: string
  role: string
}

export interface UserState {
  apitoken: string
  settings: settingsType
  invitations: Invitation[]
  invitationsFetchedAt: number | null
}

const initialState: UserState = {
  apitoken: '',
  settings: {
    place: '',
    location: '',
    count: 0,
  },
  invitations: [],
  invitationsFetchedAt: null,
}

export const userReducer = createSlice({
  name: 'user',
  initialState,
  reducers: {
    getToken: (state) => {
      state.apitoken
    },
    setToken: (state, actions) => {
      state.apitoken = actions.payload
    },
    setSettings: (state, actions) => {
      state.settings = actions.payload
    },
    setInvitations: (state, actions: PayloadAction<Invitation[]>) => {
      state.invitations = actions.payload
      state.invitationsFetchedAt = Date.now()
    },
    clearInvitationsCache: (state) => {
      state.invitations = []
      state.invitationsFetchedAt = null
    },
  },
})

export const selectToken = (state: AppState) => state.user.apitoken
export const getSettings = (state: AppState) => state.user.settings
export const selectInvitations = (state: AppState) => state.user.invitations
export const selectInvitationsFetchedAt = (state: AppState) => state.user.invitationsFetchedAt
export const { setToken, getToken, setSettings, setInvitations, clearInvitationsCache } = userReducer.actions

export const fetchInvitationsIfNeeded = (token: string): AppThunk => async (dispatch, getState) => {
  const { invitations, invitationsFetchedAt } = getState().user
  
  // Check if cache is valid
  if (invitationsFetchedAt && Date.now() - invitationsFetchedAt < INVITATIONS_CACHE_DURATION) {
    return invitations
  }
  
  // Fetch fresh invitations (import api inside to avoid circular dependency)
  const { default: api } = await import('@/library/api')
  const data = await api.get('/user/invitations', {}, token)
  if (Array.isArray(data)) {
    dispatch(setInvitations(data))
    return data
  }
  return []
}

export const getThunkSettings =
    (token: string | undefined) : AppThunk =>
    async (dispatch, getState) => {
      const currentValue = getSettings(getState())
      if (currentValue && currentValue.place == '' && !!token) {
        const { default: api } = await import('@/library/api')
        const settings = await api.get("/settings", '', token)
        dispatch(setSettings(settings))
      }
  }

const userReducerExport = userReducer.reducer
export default userReducerExport

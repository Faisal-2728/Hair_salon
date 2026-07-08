import { createSlice } from '@reduxjs/toolkit'

const accessTokenKey = localStorage.getItem('salon_access') || localStorage.getItem('salon_token') || null

const initialState = {
  user: null,
  token: accessTokenKey,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.status = 'succeeded'
      state.error = null
    },
    setUser(state, action) {
      state.user = action.payload
      state.status = 'succeeded'
      state.error = null
    },
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
    },
    setError(state, action) {
      state.error = action.payload
      state.status = 'failed'
    },
  },
})

export const { setCredentials, setUser, logout, setError } = authSlice.actions
export default authSlice.reducer

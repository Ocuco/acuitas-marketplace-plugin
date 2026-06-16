import { configureStore } from '@reduxjs/toolkit'
import imagingReducer from './imagingSlice'

export const store = configureStore({
  reducer: {
    imaging: imagingReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
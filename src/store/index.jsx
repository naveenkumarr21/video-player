// playerSlice.js
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { videoData } from '../constants/videodata';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentVideo: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMinimized: false,
    categories: videoData.categories,
  },
  reducers: {
    setCurrentVideo: (state, action) => {
      state.currentVideo = action.payload;
      state.isPlaying = true;
      state.currentTime = 0;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setMinimized: (state, action) => {
      state.isMinimized = action.payload;
    },
    closePlayer: (state) => {
      state.currentVideo = null;
      state.isPlaying = false;
      state.isMinimized = false;
    },
  },
});

export const {
  setCurrentVideo,
  togglePlay,
  setCurrentTime,
  setDuration,
  setMinimized,
  closePlayer,
} = playerSlice.actions;

export default playerSlice.reducer;

export const store = configureStore({
  reducer: {
    player: playerSlice.reducer,
  },
});
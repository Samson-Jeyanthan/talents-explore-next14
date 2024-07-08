import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type TInitialStateType = {
  isAuthenticated: boolean;
  isAbout: boolean;
  user: unknown;
  currentUserId: string;
};

const initialState: TInitialStateType = {
  isAuthenticated: false,
  isAbout: false,
  user: null,
  currentUserId: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    setIsAbout: (state, action: PayloadAction<boolean>) => {
      state.isAbout = action.payload;
    },
  },
});

export const { setIsAuthenticated, setIsAbout } = authSlice.actions;

export default authSlice.reducer;

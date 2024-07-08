import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type initialStateType = {
  mode: string;
};

const initialState: initialStateType = {
  mode: "",
};

export const utilsSlice = createSlice({
  name: "utils",
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<any>) => {
      state.mode = action.payload;
    },
  },
});

export const { setMode } = utilsSlice.actions;

export default utilsSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readToken } from '../auth';

export interface CommonState {
  token: string | undefined;
  apiUrl: string | undefined;
}

const initialState: CommonState = {
  token: readToken(),
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
};

const CommonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | undefined>) => {
      state.token = action.payload;
    },
  },
});

export const { setToken } = CommonSlice.actions;
export default CommonSlice.reducer;

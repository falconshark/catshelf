import { createSlice } from "@reduxjs/toolkit";

export interface CommonState {
  token: string | null;
}

const initialState: CommonState = {
  token: '',
};

const CommonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
  },
});

export const { setToken } = CommonSlice.actions;
export default CommonSlice.reducer;
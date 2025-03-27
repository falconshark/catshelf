import { createSlice } from "@reduxjs/toolkit";
import { getCookie } from 'cookies-next/client';
export interface CommonState {
  token: string | undefined;
  apiUrl: string | undefined;
}

async function getToken(){
  const token = await getCookie('token');
  if(token){
    return token;
  }
  return undefined;
}

const initialState: CommonState = {
  token:  await getToken(),
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
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
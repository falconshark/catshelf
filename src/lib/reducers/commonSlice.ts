import { createSlice } from "@reduxjs/toolkit";
import { getCookie } from 'cookies-next/client';
export interface CommonState {
  token: string | undefined;
  apiUrl: string | undefined;
  user: object | undefined;
}

async function getToken(){
  const token = await getCookie('token');
  if(token){
    return token;
  }
  return undefined;
}

async function getUser(token: string){
  const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user?token=${token}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
  });
  const user = await result.json();

}

const initialState: CommonState = {
  token:  await getToken(),
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  user: undefined,
};

const CommonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    }
  },
});

export const { setToken } = CommonSlice.actions;
export default CommonSlice.reducer;
import { configureStore } from "@reduxjs/toolkit";
import CommonSlice from './reducers/commonSlice';

export const store = configureStore({
  reducer:{
  // このプロパティ名をコンポーネントで値を呼び出すときに利用します。
    common: CommonSlice,
  }
})

// Redux Toolkitがコンポーネントで利用する際に必要となる値に対する型と値の更新に利用するメソッドに関する型を定義してくれる。これをexportしてコンポーネントで利用します。
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>

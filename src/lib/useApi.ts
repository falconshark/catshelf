import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './hooks';
import { forgetToken } from './auth';
import { setToken } from './reducers/commonSlice';

// Redirects to the login page when there is no token.
export function useRequireAuth() {
  const router = useRouter();
  const token = useAppSelector((state) => state.common.token);

  useEffect(() => {
    if (!token) router.replace('/');
  }, [token, router]);

  return token;
}

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useCallback(() => {
    forgetToken();
    dispatch(setToken(undefined));
    router.replace('/');
  }, [dispatch, router]);
}

// fetch() against the API with the auth header attached. An expired or revoked
// token (401) logs the user out. Content-Type is left to the caller so that
// FormData bodies keep their multipart boundary.
export function useApi() {
  const token = useAppSelector((state) => state.common.token);
  const apiUrl = useAppSelector((state) => state.common.apiUrl);
  const logout = useLogout();

  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      if (token) headers.set('Authorization', `Token ${token}`);

      const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
      if (response.status === 401) logout();
      return response;
    },
    [token, apiUrl, logout]
  );
}

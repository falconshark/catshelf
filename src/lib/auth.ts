import { getCookie, setCookie, deleteCookie } from 'cookies-next/client';

const TOKEN_COOKIE = 'token';
// Keep in step with the API's JWT_EXPIRES_IN (default 7d)
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function readToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const token = getCookie(TOKEN_COOKIE);
  return typeof token === 'string' && token ? token : undefined;
}

// The token is readable by page scripts (the API is on another origin, so it
// can't set an HttpOnly cookie for us). SameSite=Strict + Secure limit where it
// is sent.
export function persistToken(token: string) {
  setCookie(TOKEN_COOKIE, token, {
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    sameSite: 'strict',
    secure: window.location.protocol === 'https:',
  });
}

export function forgetToken() {
  deleteCookie(TOKEN_COOKIE, { path: '/' });
}

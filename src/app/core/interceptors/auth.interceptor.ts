import { HttpInterceptorFn } from '@angular/common/http';

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const csrfToken = readCookie('mw_csrf');
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const headers =
    csrfToken && mutatingMethods.includes(request.method)
      ? request.headers.set('X-CSRF-Token', csrfToken)
      : request.headers;

  return next(
    request.clone({
      headers,
      withCredentials: true,
    }),
  );
};

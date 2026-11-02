import { HttpErrorResponse } from '@angular/common/http';

const NETWORK_ERROR = 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.';

/** Mensajes que el navegador genera cuando la petición nunca obtuvo respuesta. */
const NETWORK_PATTERNS = /failed to fetch|networkerror|load failed|err_failed|err_connection/i;

export function messageOf(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    return e.error?.message ?? 'No se pudo conectar con el servidor';
  }
  return 'Ocurrió un error inesperado';
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    // status 0 = sin respuesta: API caída, URL/puerto incorrecto o CORS bloqueado
    if (err.status === 0) {
      return NETWORK_ERROR;
    }
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return NETWORK_PATTERNS.test(body.message) ? NETWORK_ERROR : body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return `Error ${err.status}: ${err.statusText || 'solicitud fallida'}`;
  }
  if (err instanceof Error) {
    return NETWORK_PATTERNS.test(err.message) ? NETWORK_ERROR : err.message;
  }
  return 'Ocurrió un error inesperado';
}
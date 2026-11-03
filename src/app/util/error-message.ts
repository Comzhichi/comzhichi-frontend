import { HttpErrorResponse } from '@angular/common/http';

export function messageOf(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    return e.error?.message ?? 'No se pudo conectar con el servidor';
  }
  return 'Ocurrió un error inesperado';
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.';
    }
    return `Error ${err.status}: ${err.statusText || 'solicitud fallida'}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Ocurrió un error inesperado';
}
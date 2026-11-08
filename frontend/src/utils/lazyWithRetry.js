import { lazy } from 'react';
import { recoverFromChunkError } from './appRecovery';

const isChunkLoadError = (error) => {
  const message = (error?.message || '').toLowerCase();
  return (
    error?.name === 'ChunkLoadError' ||
    error?.name === 'ChunkLoadTimeoutError' ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('importing a module script failed') ||
    message.includes('mime type') ||
    message.includes('syntaxerror') ||
    message.includes('unexpected token') ||
    message.includes('chunk no encontrado') ||
    message.includes('is not valid javascript')
  );
};

const loadChunkWithTimeout = (componentImport, name, timeoutMs) => {
  let timeoutId;
  const importPromise = Promise.resolve().then(componentImport);
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`La carga del chunk "${name}" superó ${timeoutMs} ms`);
      error.name = 'ChunkLoadTimeoutError';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([importPromise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const lazyWithRetry = (componentImport, name = 'chunk') =>
  lazy(async () => {
    try {
      return await loadChunkWithTimeout(componentImport, name, 15000);
    } catch (firstError) {
      console.warn(`[lazyWithRetry] Primer intento fallido para "${name}", reintentando...`, firstError);
      await new Promise((resolve) => setTimeout(resolve, 600));

      try {
        return await loadChunkWithTimeout(componentImport, name, 7000);
      } catch (secondError) {
        console.warn(`[lazyWithRetry] Error persistente al cargar chunk "${name}":`, secondError);

        if (isChunkLoadError(secondError)) {
          const recovered = await recoverFromChunkError();
          if (recovered) return new Promise(() => {});
        }

        throw secondError;
      }
    }
  });

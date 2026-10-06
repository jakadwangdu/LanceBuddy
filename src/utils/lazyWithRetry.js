import React from 'react';

/**
 * Robust wrapper around React.lazy to prevent chunk load failures
 * when a new production build is deployed with new chunk hashes.
 */
export function lazyWithRetry(componentImport) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const msg = error?.message || '';
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('dynamically imported module') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && typeof window !== 'undefined') {
        const key = 'lb_chunk_retry_' + window.location.pathname;
        const retried = sessionStorage.getItem(key);
        if (!retried) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise(() => {}); // Halt until page reloads
        }
      }
      throw error;
    }
  });
}

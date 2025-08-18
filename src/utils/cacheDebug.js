// Debug utility for URL cache
import urlCache from './urlCache';

// Add to window for debugging in console
if (typeof window !== 'undefined') {
  window.urlCacheDebug = {
    // Get cache statistics
    getStats: () => {
      return urlCache.getCacheStats();
    },
    
    // Clear cache
    clearCache: () => {
      urlCache.clearCache();
    },
    
    // Show cache contents
    showCache: () => {
      const stats = urlCache.getCacheStats();
      
      // Show cache keys (first 10)
      const keys = Array.from(urlCache.cache.keys()).slice(0, 10);
      
      return stats;
    },
    
    // Preload specific URLs
    preloadUrl: async (type, id, index = null) => {
      try {
        const url = await urlCache.getUrl(type, id, index, async () => {
          // This is a placeholder - you'd need to implement the actual fetch logic
          throw new Error('Preload function not implemented for this type');
        });
        return url;
      } catch (error) {
        console.error('Preload failed:', error);
      }
    }
  };
  

}

export default window?.urlCacheDebug; 
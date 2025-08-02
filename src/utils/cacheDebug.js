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
      console.log('Cache cleared');
    },
    
    // Show cache contents
    showCache: () => {
      const stats = urlCache.getCacheStats();
      console.log('URL Cache Statistics:', stats);
      
      // Show cache keys (first 10)
      const keys = Array.from(urlCache.cache.keys()).slice(0, 10);
      console.log('Cache Keys (first 10):', keys);
      
      return stats;
    },
    
    // Preload specific URLs
    preloadUrl: async (type, id, index = null) => {
      try {
        const url = await urlCache.getUrl(type, id, index, async () => {
          // This is a placeholder - you'd need to implement the actual fetch logic
          throw new Error('Preload function not implemented for this type');
        });
        console.log(`Preloaded URL for ${type}:${id}:`, url);
        return url;
      } catch (error) {
        console.error('Preload failed:', error);
      }
    }
  };
  
  console.log('URL Cache Debug available. Use window.urlCacheDebug.showCache() to see cache stats.');
}

export default window?.urlCacheDebug; 
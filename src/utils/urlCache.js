// URL Cache Manager for presigned URLs
class UrlCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 25 * 60 * 1000; // 25 minutes (5 minutes before S3 expiry)
    this.refreshThreshold = 20 * 60 * 1000; // 20 minutes (when to refresh)
    this.backgroundRefreshInterval = null;
    this.startBackgroundRefresh();
  }

  // Generate a cache key
  getCacheKey(type, id, index = null) {
    return `${type}:${id}${index !== null ? `:${index}` : ""}`;
  }

  // Check if cached URL is still valid
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.cacheExpiry;
  }

  // Get cached URL or null if not valid
  getCachedUrl(key) {
    if (!this.isCacheValid(key)) {
      this.cache.delete(key);
      return null;
    }
    return this.cache.get(key).url;
  }

  // Cache a URL
  setCachedUrl(key, url) {
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
    });
  }

  // Get URL with caching
  async getUrl(type, id, index = null, fetchFunction) {
    const key = this.getCacheKey(type, id, index);

    // Check cache first
    const cachedUrl = this.getCachedUrl(key);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Fetch new URL
    try {
      const url = await fetchFunction();
      this.setCachedUrl(key, url);
      return url;
    } catch (error) {
      console.error(`Error fetching URL for ${key}:`, error);
      throw error;
    }
  }

  // Preload multiple URLs
  async preloadUrls(items, fetchFunction) {
    const promises = items.map((item) =>
      this.getUrl(item.type, item.id, item.index, () => fetchFunction(item))
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error preloading URLs:", error);
    }
  }

  // Background refresh of expiring URLs
  startBackgroundRefresh() {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
    }

    this.backgroundRefreshInterval = setInterval(() => {
      const now = Date.now();
      const refreshPromises = [];

      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.refreshThreshold) {
          // Parse key to get type, id, index
          const parts = key.split(":");
          const type = parts[0];
          const id = parts[1];
          const index = parts[2] || null;

          // Queue refresh (don't await to avoid blocking)
          refreshPromises.push(
            this.refreshUrl(type, id, index).catch((err) =>
              console.error(`Background refresh failed for ${key}:`, err)
            )
          );
        }
      }

      if (refreshPromises.length > 0) {
        Promise.all(refreshPromises);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Refresh a specific URL
  async refreshUrl(type, id, index = null) {
    const key = this.getCacheKey(type, id, index);
    const cached = this.cache.get(key);

    if (!cached) return;

    try {
      // This would need to be implemented based on the specific fetch function
      // For now, we'll just remove expired entries
      this.cache.delete(key);
    } catch (error) {
      console.error(`Error refreshing URL for ${key}:`, error);
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp < this.cacheExpiry) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  // Cleanup
  destroy() {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
    }
    this.cache.clear();
  }
}

// Create singleton instance
const urlCache = new UrlCache();

export default urlCache;

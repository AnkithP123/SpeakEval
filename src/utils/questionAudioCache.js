/**
 * Question Audio URL Cache
 * 
 * Stores and retrieves question audio URLs by questionId.
 * Used for frontend caching of question audio from the backend's questionAudioUrls object.
 */

class QuestionAudioCache {
  constructor() {
    this.cache = new Map(); // questionId -> audioUrl
    this.audioElements = new Map(); // questionId -> Audio element (for preloading)
  }

  /**
   * Initialize cache with questionAudioUrls object from backend
   * @param {Object} questionAudioUrls - Object mapping questionId -> presigned URL
   */
  initialize(questionAudioUrls) {
    if (!questionAudioUrls || typeof questionAudioUrls !== 'object') {
      return;
    }

    // Clear existing cache
    this.cache.clear();
    this.audioElements.clear();

    // Populate cache
    Object.entries(questionAudioUrls).forEach(([questionId, audioUrl]) => {
      this.cache.set(questionId, audioUrl);
      
      // Preload audio for instant playback
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      this.audioElements.set(questionId, audio);
    });

    console.log(`[QuestionAudioCache] Initialized with ${this.cache.size} question audio URLs`);
  }

  /**
   * Get audio URL for a questionId
   * @param {string} questionId - The question ID
   * @returns {string|null} Audio URL or null if not found
   */
  getUrl(questionId) {
    if (!questionId) return null;
    return this.cache.get(questionId) || null;
  }

  /**
   * Get preloaded Audio element for instant playback
   * @param {string} questionId - The question ID
   * @returns {HTMLAudioElement|null} Audio element or null if not found
   */
  getAudioElement(questionId) {
    if (!questionId) return null;
    return this.audioElements.get(questionId) || null;
  }

  /**
   * Play question audio by questionId
   * @param {string} questionId - The question ID
   * @returns {Promise<void>}
   */
  async play(questionId) {
    const audio = this.getAudioElement(questionId);
    if (audio) {
      try {
        await audio.play();
      } catch (error) {
        console.error(`[QuestionAudioCache] Error playing audio for ${questionId}:`, error);
        throw error;
      }
    } else {
      throw new Error(`Question audio not found for ID: ${questionId}`);
    }
  }

  /**
   * Pause question audio by questionId
   * @param {string} questionId - The question ID
   */
  pause(questionId) {
    const audio = this.getAudioElement(questionId);
    if (audio) {
      audio.pause();
    }
  }

  /**
   * Check if questionId exists in cache
   * @param {string} questionId - The question ID
   * @returns {boolean}
   */
  has(questionId) {
    return this.cache.has(questionId);
  }

  /**
   * Clear the cache
   */
  clear() {
    // Clean up audio elements
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.cache.clear();
    this.audioElements.clear();
  }

  /**
   * Get all cached question IDs
   * @returns {string[]}
   */
  getAllQuestionIds() {
    return Array.from(this.cache.keys());
  }
}

// Export singleton instance
const questionAudioCache = new QuestionAudioCache();
export default questionAudioCache;

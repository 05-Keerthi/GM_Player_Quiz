// cacheService.js
const CACHE_NAME = "session-cache-v1";
const QUIZ_SESSION_KEY = "/active-quiz-session";
const SURVEY_SESSION_KEY = "/active-survey-session";

export const cacheService = {
  async saveSession(sessionData, contentType) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const expirationTime = new Date().getTime() + 5 * 60 * 1000; // 5 minutes

      const dataToStore = {
        ...sessionData,
        contentType,
        expirationTime,
      };

      const response = new Response(JSON.stringify(dataToStore), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=300", // 5 minutes in seconds
        },
      });

      const cacheKey =
        contentType === "survey" ? SURVEY_SESSION_KEY : QUIZ_SESSION_KEY;
      await cache.put(cacheKey, response);
      return true;
    } catch (error) {
      console.error("Failed to save session to cache:", error);
      return false;
    }
  },

  async getSession(contentType) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey =
        contentType === "survey" ? SURVEY_SESSION_KEY : QUIZ_SESSION_KEY;
      const response = await cache.match(cacheKey);

      if (!response) return null;

      const sessionData = await response.json();
      const currentTime = new Date().getTime();

      // Check if session has expired
      if (currentTime > sessionData.expirationTime) {
        await this.clearSession(contentType);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Failed to get session from cache:", error);
      return null;
    }
  },

  async clearSession(contentType) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey =
        contentType === "survey" ? SURVEY_SESSION_KEY : QUIZ_SESSION_KEY;
      await cache.delete(cacheKey);
      return true;
    } catch (error) {
      console.error("Failed to clear session from cache:", error);
      return false;
    }
  },

  async clearAllSessions() {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all([
        cache.delete(QUIZ_SESSION_KEY),
        cache.delete(SURVEY_SESSION_KEY),
      ]);
      return true;
    } catch (error) {
      console.error("Failed to clear all sessions from cache:", error);
      return false;
    }
  },
};

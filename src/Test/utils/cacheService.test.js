// src/Test/utils/cacheService.test.js
describe("cacheService", () => {
  let mockCache;
  let mockCaches;
  let cacheService;

  beforeEach(() => {
    // Create mock cache implementation
    mockCache = {
      put: jest.fn(),
      match: jest.fn(),
      delete: jest.fn(),
    };

    // Mock global caches API
    mockCaches = {
      open: jest.fn().mockResolvedValue(mockCache),
    };

    global.caches = mockCaches;

    // Mock Response constructor
    global.Response = jest.fn().mockImplementation((body) => ({
      json: () => Promise.resolve(JSON.parse(body)),
    }));

    // Reset the module before each test
    jest.isolateModules(() => {
      cacheService = require("../../utils/cacheService").cacheService;
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-02-05"));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("saveSession", () => {
    it("should successfully save a quiz session", async () => {
      const sessionData = { id: "123", data: "test" };

      const result = await cacheService.saveSession(sessionData, "quiz");

      expect(result).toBe(true);
      expect(mockCaches.open).toHaveBeenCalledWith("session-cache-v1");
      expect(mockCache.put).toHaveBeenCalledWith(
        "/active-quiz-session",
        expect.any(Object)
      );
    });

    it("should successfully save a survey session", async () => {
      const sessionData = { id: "123", data: "test" };

      const result = await cacheService.saveSession(sessionData, "survey");

      expect(result).toBe(true);
      expect(mockCache.put).toHaveBeenCalledWith(
        "/active-survey-session",
        expect.any(Object)
      );
    });

    it("should handle errors when saving session", async () => {
      mockCache.put.mockRejectedValue(new Error("Cache error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await cacheService.saveSession({ id: "123" }, "quiz");

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getSession", () => {
    it("should return null if no session exists", async () => {
      mockCache.match.mockResolvedValue(null);

      const result = await cacheService.getSession("quiz");

      expect(result).toBeNull();
    });

    it("should return session data if valid session exists", async () => {
      const sessionData = {
        id: "123",
        expirationTime: new Date().getTime() + 300000, // 5 minutes from now
      };

      mockCache.match.mockResolvedValue({
        json: () => Promise.resolve(sessionData),
      });

      const result = await cacheService.getSession("quiz");

      expect(result).toEqual(sessionData);
    });

    it("should clear and return null if session has expired", async () => {
      const sessionData = {
        id: "123",
        expirationTime: new Date().getTime() - 1000, // Expired
      };

      mockCache.match.mockResolvedValue({
        json: () => Promise.resolve(sessionData),
      });

      const result = await cacheService.getSession("quiz");

      expect(result).toBeNull();
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe("clearSession", () => {
    it("should successfully clear a quiz session", async () => {
      mockCache.delete.mockResolvedValue(true);

      const result = await cacheService.clearSession("quiz");

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledWith("/active-quiz-session");
    });

    it("should successfully clear a survey session", async () => {
      mockCache.delete.mockResolvedValue(true);

      const result = await cacheService.clearSession("survey");

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledWith("/active-survey-session");
    });

    it("should handle errors when clearing session", async () => {
      mockCache.delete.mockRejectedValue(new Error("Cache error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await cacheService.clearSession("quiz");

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("clearAllSessions", () => {
    it("should successfully clear all sessions", async () => {
      mockCache.delete.mockResolvedValue(true);

      const result = await cacheService.clearAllSessions();

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledTimes(2);
      expect(mockCache.delete).toHaveBeenCalledWith("/active-quiz-session");
      expect(mockCache.delete).toHaveBeenCalledWith("/active-survey-session");
    });

    it("should handle errors when clearing all sessions", async () => {
      mockCache.delete.mockRejectedValue(new Error("Cache error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await cacheService.clearAllSessions();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

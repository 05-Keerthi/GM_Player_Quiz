const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../../services/authService");

describe("Auth Service", () => {
  const mockUser = { _id: "12345", role: "user" };
  const mockAccessToken = "mockAccessToken";
  const mockRefreshToken = "mockRefreshToken";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should generate an access token", () => {
    jwt.sign = jest.fn().mockReturnValue(mockAccessToken);
    const token = generateAccessToken(mockUser);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUser._id, role: mockUser.role, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    expect(token).toBe(mockAccessToken);
  });

  test("should generate a refresh token", () => {
    jwt.sign = jest.fn().mockReturnValue(mockRefreshToken);
    const token = generateRefreshToken(mockUser);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUser._id, role: mockUser.role, type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "24h" }
    );
    expect(token).toBe(mockRefreshToken);
  });

  test("should verify a valid token", () => {
    const mockDecoded = { id: mockUser._id, role: mockUser.role, type: "access" };
    jwt.verify = jest.fn().mockReturnValue(mockDecoded);
    const decoded = verifyToken(mockAccessToken, process.env.JWT_SECRET);
    expect(jwt.verify).toHaveBeenCalledWith(mockAccessToken, process.env.JWT_SECRET);
    expect(decoded).toEqual(mockDecoded);
  });

  test("should throw an error for an invalid token", () => {
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error("Token validation failed");
    });
    expect(() => verifyToken("invalidToken", process.env.JWT_SECRET)).toThrow("Token validation failed");
  });
});
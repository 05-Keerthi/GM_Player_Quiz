const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../../app"); // Your Express app
const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken } = require("../../services/authService");
require("dotenv").config({ path: ".env.test" });

// Increase timeout for database operations
jest.setTimeout(50000);

// Connect to the database before running tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI)
});

// Disconnect from the database after tests
afterAll(async () => {
  await mongoose.disconnect();
});

describe("Auth Controller", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        username: "Akash",
        email: "Akash@example.com",
        password: "password123",
        mobile: "9876543210",
        role: "user",
      };
  
      const response = await request(app).post("/api/auth/register").send(newUser);
  
      // Log response for debugging
      console.log("Response body:", response.body);
  
      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty("username", "Akash");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refresh_token");
  
      const userInDb = await User.findOne({ email: "Akash@example.com" });
      expect(userInDb).not.toBeNull();
    });

    it("should return an error if the username is already registered", async () => {
      // const existingUser = new User({
      //   username: "ashok",
      //   email: "ashok@example.com",
      //   password: await bcrypt.hash("password123", 10),
      //   mobile: "9876543210",
      //   role: "user",
      // });
      // await existingUser.save();

      const newUser = {
        username: "ashok",
        email: "ashokkumar@example.com",
        password: "Ashok@12345",
        mobile: "8876543200",
        role: "user",
      };

      const response = await request(app).post("/api/auth/register").send(newUser);

    // Assert that the status is 400 and the error message is correct
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Username is already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      // await User.create({
      //   username: "Akash",
      //   email: "Akash@example.com",
      //   password: "Akash@12345",
      //   mobile: "9876093210",
      //   role: "user",
      // });
    });

    it("should log in a user successfully and return tokens", async () => {
      const loginData = {
        email: "Akash@example.com",
        password: "password123",
      };
    
      const response = await request(app).post("/api/auth/login").send(loginData);
    
      // Log response for debugging
      console.log("Response status:", response.status);
      console.log("Response body:", response.body);
    
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refresh_token");
    });

    it("should return an error for incorrect password", async () => {
      const loginData = {
        email: "Akash@example.com",
        password: "Ashok@12345",
      };

      const response = await request(app).post("/api/auth/login").send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid Password.");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should refresh the access token successfully", async () => {
      const user = await User.findOne({ email: "Akash@example.com" });
      const refreshToken = generateRefreshToken(user);

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refresh_token: refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should return an error for an invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refresh_token: "invalid_token" });
    
      console.log("Response body:", response.body); // Log for debugging
    
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Token validation failed."); // Updated
    });
  });

  describe("GET /api/auth/me", () => {
    let token;
    const userId = "existingUserId"; // Replace with an actual user ID from your database
  
    beforeAll(() => {
      // Generate a JWT token for the existing user
      token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
    });
  
    it("should retrieve the user profile", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
  
      console.log("Response body:", response.body); // For debugging
  
    expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("username", "Akash");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should log out the user successfully", async () => {
      const user = await User.findOne({ email: "Akash@example.com" });
      const token = generateAccessToken(user);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Successfully logged out.");
    });
  });
});

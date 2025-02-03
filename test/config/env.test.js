const dotenv = require('dotenv');

// Mock dotenv.config to load your environment variables
jest.mock('dotenv', () => ({
  config: jest.fn(() => ({
    parsed: {
      PORT: '5000',
      MONGO_URI: 'mongodb+srv://gmitndevksenthil:idbCoz3enjwQvPBD@cluster0.j3exv.mongodb.net/GM_Player_quiz?retryWrites=true&w=majority',
      JWT_SECRET: 'your_jwt_secret_key',
      JWT_REFRESH_SECRET: 'your-refresh-token-secret',
      EMAIL_USER: 'ragavi2871@gmail.com',
      EMAIL_PASS: 'xbak nsyf dvxd jmil',
      FRONTEND_URL: 'http://localhost:3000',
      redirectingUrl: 'http://localhost:5000/register',
      HOST: 'http://localhost:5000/uploads/',
    },
  })),
}));

describe('dotenv config', () => {
  it('should load environment variables into process.env', () => {
    // Call dotenv.config()
    dotenv.config();

    // Assertions to check if environment variables are loaded correctly
    // expect(process.env.PORT).toBe('5000');
    expect(process.env.MONGO_URI).toBe('mongodb+srv://gmitndevksenthil:idbCoz3enjwQvPBD@cluster0.j3exv.mongodb.net/GM_Player_quiz?retryWrites=true&w=majority');
    expect(process.env.JWT_SECRET).toBe('your_jwt_secret_key');
    expect(process.env.JWT_REFRESH_SECRET).toBe('your-refresh-token-secret');
    expect(process.env.EMAIL_USER).toBe('ragavi2871@gmail.com');
    expect(process.env.EMAIL_PASS).toBe('xbak nsyf dvxd jmil');
    expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
    expect(process.env.redirectingUrl).toBe('http://localhost:5000/register');
    expect(process.env.HOST).toBe('http://localhost:5000/uploads/');
  });
});

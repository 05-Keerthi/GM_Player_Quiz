const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('../../config/db');
const app = require('../../app');
const socketHandler = require('../../sockets/sockets');

// Mock dependencies
jest.mock('../../config/db', () => jest.fn());
jest.mock('../../app', () => ({
  set: jest.fn(),
}));
jest.mock('socket.io', () => jest.fn(() => ({
  on: jest.fn(),
  emit: jest.fn(),
})));
jest.mock('../../sockets/sockets', () => jest.fn());

describe('Server', () => {
  let server;

  beforeAll(() => {
    // Mock HTTP server creation
    jest.spyOn(http, 'createServer').mockImplementation((handler) => ({
      listen: jest.fn((port, callback) => callback()),
      close: jest.fn((callback) => callback && callback()),
    }));

    // Require the server file (this runs the server initialization code)
    server = require('../../server');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should call connectDB to connect to the database', () => {
    expect(connectDB).toHaveBeenCalled();
  });

  it('should create an HTTP server using the Express app', () => {
    expect(http.createServer).toHaveBeenCalledWith(app);
  });

  it('should initialize Socket.IO with the HTTP server', () => {
    expect(socketIo).toHaveBeenCalledWith(
      expect.any(Object), // HTTP server instance
      {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      }
    );
  });

  it('should set Socket.IO instance in the app', () => {
    expect(app.set).toHaveBeenCalledWith('socketio', expect.any(Object));
  });

  it('should call socketHandler with the Socket.IO instance', () => {
    expect(socketHandler).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should start the HTTP server on the specified port', () => {
    const mockServerInstance = http.createServer.mock.results[0].value;
    expect(mockServerInstance.listen).toHaveBeenCalledWith(
      process.env.PORT || 5000,
      expect.any(Function)
    );
  });

  it('should log the server start message', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
    // Import the server file after setting up the spy
    jest.resetModules(); // Reset module cache to ensure fresh import
    require('../../server');
  
    expect(logSpy).toHaveBeenCalledWith(
      `Server running on port ${process.env.PORT || 5000}`
    );
  
    logSpy.mockRestore();
  });
  
});

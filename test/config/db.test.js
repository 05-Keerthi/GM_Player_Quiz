const mongoose = require('mongoose');
const connectDB = require('../../config/db');

// Mock mongoose.connect
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log "MongoDB Connected" on successful connection', async () => {
    // Mock successful connection
    mongoose.connect.mockResolvedValueOnce('Connected');

    // Mock console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(consoleLogSpy).toHaveBeenCalledWith('MongoDB Connected');

    consoleLogSpy.mockRestore();
  });

  it('should log error and exit on failed connection', async () => {
    // Mock connection failure
    mongoose.connect.mockRejectedValueOnce(new Error('Connection Failed'));

    // Mock console.error and process.exit
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection error:', 'Connection Failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});

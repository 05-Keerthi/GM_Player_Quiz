const morgan = require('morgan');
const express = require('express');
const logger = require('../../config/logger'); // Import your logger module

jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));

describe('Logger Middleware', () => {
  let app;

  beforeEach(() => {
    app = express(); // Create a new Express instance for each test
    jest.clearAllMocks(); // Clear any previous mock calls
  });

  it('should use morgan middleware in dev mode', () => {
    // Call the logger function
    logger(app);

    // Verify that morgan was called with 'dev' mode
    expect(morgan).toHaveBeenCalledWith('dev');
  });

  it('should add morgan middleware to the Express app', () => {
    // Mock the app.use method
    const useSpy = jest.spyOn(app, 'use');

    // Call the logger function
    logger(app);

    // Verify that app.use was called
    expect(useSpy).toHaveBeenCalled();
    expect(morgan).toHaveBeenCalled();
  });
});

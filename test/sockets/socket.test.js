const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const setupSockets = require('../../sockets/sockets');

// Mock the models
jest.mock('../../models/answer');
jest.mock('../../models/question');
const Answer = require('../../models/answer');
const Question = require('../../models/question');

describe('Socket.io Server', () => {
  let io, serverSocket, clientSocket, port;

  beforeAll((done) => {
    port = 3005;
    const httpServer = require('http').createServer();
    io = new Server(httpServer);
    setupSockets(io);
    httpServer.listen(port, () => {
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Quiz Related Tests
  describe('Quiz Socket Events', () => {
    test('should handle join-session event', (done) => {
      const sessionData = {
        sessionId: 'test-session',
        userId: 'user123',
        username: 'testUser'
      };

      clientSocket.on('user-joined', (data) => {
        expect(data.userId).toBe(sessionData.userId);
        expect(data.username).toBe(sessionData.username);
        expect(data.message).toBe('A new user has joined the session.');
        done();
      });

      clientSocket.emit('join-session', sessionData);
    });

    describe('Common Socket Events', () => {
      test('should handle send-notification event', (done) => {
        const notificationData = {
          sessionId: 'test-session',
          notification: {
            type: 'info',
            message: 'Test notification'
          }
        };
  
        // Create a Promise to handle the notification
        const notificationPromise = new Promise((resolve) => {
          clientSocket.on('receive-notification', (notification) => {
            expect(notification).toEqual(notificationData.notification);
            resolve();
          });
        });
  
        // Emit the notification
        clientSocket.emit('send-notification', notificationData);
  
        // Wait for the Promise to resolve
        notificationPromise.then(() => {
          done();
        }).catch((error) => {
          done(error);
        });
      },100000);

    test('should handle create-session event', (done) => {
      const sessionData = {
        sessionId: 'new-session'
      };

      clientSocket.on('session-created', (data) => {
        expect(data.sessionId).toBe(sessionData.sessionId);
        done();
      });

      clientSocket.emit('create-session', sessionData);
    });

    test('should handle next-item event', (done) => {
      const itemData = {
        sessionId: 'test-session',
        type: 'question',
        item: { id: 1, text: 'Test question' },
        isLastItem: false
      };

      clientSocket.on('next-item', (data) => {
        expect(data.type).toBe(itemData.type);
        expect(data.item).toEqual(itemData.item);
        expect(data.isLastItem).toBe(itemData.isLastItem);
        done();
      });

      clientSocket.emit('next-item', itemData);
    });

    test('should handle timer-sync event', (done) => {
      const timerData = {
        sessionId: 'test-session',
        timeLeft: 30
      };

      clientSocket.on('timer-sync', (data) => {
        expect(data.timeLeft).toBe(timerData.timeLeft);
        done();
      });

      clientSocket.emit('timer-sync', timerData);
    });

    test('should handle answer-submitted event', (done) => {
      const mockQuestion = {
        _id: 'question123',
        options: [{ text: 'Option A' }, { text: 'Option B' }]
      };
      const mockAnswers = [{ answer: 'Option A' }, { answer: 'Option B' }];

      Question.findById.mockResolvedValue(mockQuestion);
      Answer.find.mockResolvedValue(mockAnswers);

      const answerData = {
        sessionId: 'test-session',
        answerDetails: {
          questionId: 'question123',
          answer: 'Option A'
        }
      };

      clientSocket.on('answer-counts-updated', (data) => {
        expect(data.questionId).toBe(answerData.answerDetails.questionId);
        expect(data.counts).toBeDefined();
        done();
      });

      clientSocket.emit('answer-submitted', answerData);
    });

    test('should handle quiz-completed event', (done) => {
      const sessionData = {
        sessionId: 'test-session'
      };

      clientSocket.on('quiz-completed', (data) => {
        expect(data.message).toBe('Quiz has been completed');
        done();
      });

      clientSocket.emit('quiz-completed', sessionData);
    });

    test('should handle end-session event', (done) => {
      const sessionData = {
        sessionId: 'test-session'
      };

      clientSocket.on('session-ended', (data) => {
        expect(data.message).toBe('Session has ended');
        done();
      });

      clientSocket.emit('end-session', sessionData);
    });
  });

    // Survey Related Tests
    describe('Survey Socket Events', () => {
        test('should handle create-survey-session event', (done) => {
          const sessionData = {
            sessionId: 'survey-session'
          };
    
          clientSocket.on('survey-session-created', (data) => {
            expect(data.sessionId).toBe(sessionData.sessionId);
            done();
          });
    
          clientSocket.emit('create-survey-session', sessionData);
        });
    
        test('should handle join-survey-session event', (done) => {
          const mockData = {
            sessionId: 'survey-session',
            userId: 'user123',
            username: 'TestUser',
            isGuest: true
          };
    
          clientSocket.emit('join-survey-session', mockData);
    
          clientSocket.on('user-joined-survey', (data) => {
            expect(data.userId).toBe(mockData.userId);
            expect(data.username).toBe(mockData.username);
            expect(data.isGuest).toBe(mockData.isGuest);
            done();
          });
        });
    
        test('should handle next-survey-question event', (done) => {
          const questionData = {
            sessionId: 'survey-session',
            type: 'multiple-choice',
            item: { id: 1, text: 'Survey question' },
            isLastItem: false,
            initialTime: 30
          };
    
          clientSocket.on('next-survey-question', (data) => {
            expect(data.type).toBe(questionData.type);
            expect(data.question).toEqual(questionData.item);
            expect(data.isLastQuestion).toBe(questionData.isLastItem);
            expect(data.initialTime).toBe(questionData.initialTime);
            done();
          });
    
          clientSocket.emit('next-survey-question', questionData);
        });
    
        // Fixed survey-timer-sync test
        test('should handle survey-timer-sync event', (done) => {
          const timerData = {
            sessionId: 'survey-session',
            timeLeft: 30
          };
    
          clientSocket.on('timer-sync', (data) => {
            expect(data.timeLeft).toBe(30);
            done();
          });
    
          clientSocket.emit('survey-timer-sync', timerData);
        }, 10000); // Increased timeout
    
        test('should handle survey-submit-answer and answer-submission-confirmed events', (done) => {
          const answerData = {
            sessionId: 'survey-session',
            questionId: 'question123',
            userId: 'user123',
            answer: 'Selected option',
            timeTaken: 15,
            isGuest: false, // Added isGuest field
          };
        
          let surveyAnswerReceived = false;
          let confirmationReceived = false;
        
          clientSocket.on('survey-answer-submitted', (data) => {
            expect(data.questionId).toBe(answerData.questionId);
            expect(data.userId).toBe(answerData.userId);
            expect(data.answer).toBe(answerData.answer);
            expect(data.timeTaken).toBe(answerData.timeTaken);
            expect(data.isGuest).toBe(answerData.isGuest); // Validate isGuest
            surveyAnswerReceived = true;
            if (confirmationReceived) done();
          });
        
          clientSocket.on('answer-submission-confirmed', (data) => {
            expect(data.status).toBe('success');
            expect(data.questionId).toBe(answerData.questionId);
            confirmationReceived = true;
            if (surveyAnswerReceived) done();
          });
        
          clientSocket.emit('survey-submit-answer', answerData);
        });
        
        test('should handle survey-completed event', (done) => {
          const sessionData = {
            sessionId: 'survey-session'
          };
    
          clientSocket.on('survey-completed', (data) => {
            expect(data.message).toBe('Survey has been completed');
            done();
          });
    
          clientSocket.emit('survey-completed', sessionData);
        });
    
        test('should handle end-survey-session event', (done) => {
          const sessionData = {
            sessionId: 'survey-session'
          };
    
          clientSocket.on('survey-session-ended', (data) => {
            expect(data.message).toBe('Survey session has ended');
            done();
          });
    
          clientSocket.emit('end-survey-session', sessionData);
        });
      });
    
      // Common Handlers Tests
   
    
        test('should handle disconnect event', (done) => {
          const mockDisconnectHandler = jest.fn();
          io.on('disconnect', mockDisconnectHandler);
    
          clientSocket.on('disconnect', () => {
            expect(mockDisconnectHandler).not.toHaveBeenCalled();
            done();
          });
    
          clientSocket.disconnect();
        });
      });
    });
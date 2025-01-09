const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Session = require('../../models/session');
const Quiz = require('../../models/quiz');
const Leaderboard = require('../../models/leaderBoard');
const mailService = require('../../services/mailService');

// Mock all dependencies
jest.mock('../../models/Notification');
jest.mock('../../models/User');
jest.mock('../../models/session');
jest.mock('../../models/quiz');
jest.mock('../../models/leaderBoard');
jest.mock('../../services/mailService');

const {
  createNotification,
  getNotificationsByUserId,
  markAsRead,
  deleteNotification
} = require('../../controllers/notificationController');

describe('Notification Controller', () => {
  let req;
  let res;
  let mockIo;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        role: 'admin'
      },
      params: {},
      body: {},
      app: {
        get: jest.fn()
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockIo = {
      emit: jest.fn()
    };
    req.app.get.mockReturnValue(mockIo);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('createNotification', () => {
    const mockSessionData = {
      _id: 'session123',
      qrData: 'mockQRData',
      joinCode: '123456',
      quiz: {
        title: 'Test Quiz'
      }
    };

    it('should create invitation notifications successfully', async () => {
      // Setup
      req.body = {
        message: 'Test invitation',
        type: 'invitation',
        sessionId: 'session123',
        users: ['user1', 'user2']
      };

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSessionData)
        })
      });

      User.findById.mockImplementation((id) => ({
        _id: id,
        email: 'test@example.com',
        username: 'testuser'
      }));

      Notification.insertMany.mockResolvedValue([]);

      // Execute
      await createNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Notifications sent successfully'
      }));
      expect(mailService.sendQuizInvitationMail).toHaveBeenCalled();
      expect(mockIo.emit).toHaveBeenCalledWith('new_notification', expect.any(Object));
    });

    it('should create session update notifications successfully', async () => {
      // Setup
      req.body = {
        type: 'session_update',
        sessionId: 'session123'
      };

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSessionData)
        })
      });

      Notification.find.mockResolvedValue([
        { user: 'user1' },
        { user: 'user2' }
      ]);

      // Execute
      await createNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mailService.sendQuizSessionUpdateMail).toHaveBeenCalled();
    });

    it('should create quiz result notifications successfully', async () => {
      // Setup
      req.body = {
        type: 'quiz_result',
        sessionId: 'session123'
      };

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSessionData)
        })
      });

      Leaderboard.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              player: { _id: 'user1', name: 'User 1' },
              score: 100,
              rank: 1
            }
          ])
        })
      });

      // Execute
      await createNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mailService.sendQuizResultMail).toHaveBeenCalled();
    });

    it('should return error if user is not admin', async () => {
      // Setup
      req.user.role = 'user';

      // Execute
      await createNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Admins only.'
      });
    });
  });

  describe('getNotificationsByUserId', () => {
    it('should get notifications for authorized user', async () => {
      // Setup
      req.params.userId = 'user123';
      const mockNotifications = [
        {
          _id: 'notif1',
          message: 'Test notification',
          toObject: () => ({
            _id: 'notif1',
            message: 'Test notification'
          })
        }
      ];

      Notification.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockNotifications)
      });

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            qrData: 'mockQRData',
            joinCode: '123456',
            quiz: { title: 'Test Quiz' }
          })
        })
      });

      // Execute
      await getNotificationsByUserId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        notifications: expect.any(Array)
      });
    });

    it('should return error for unauthorized access', async () => {
      // Setup
      req.params.userId = 'otherUser';
      req.user.role = 'user';

      // Execute
      await getNotificationsByUserId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Setup
      req.params.id = 'notif123';
      Notification.findOneAndUpdate.mockResolvedValue({
        _id: 'notif123',
        read: true
      });

      // Execute
      await markAsRead(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockIo.emit).toHaveBeenCalledWith('notification_read', expect.any(Object));
    });

    it('should return error if notification not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Notification.findOneAndUpdate.mockResolvedValue(null);

      // Execute
      await markAsRead(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      // Setup
      req.params.id = 'notif123';
      Notification.findByIdAndDelete.mockResolvedValue({
        _id: 'notif123'
      });

      // Execute
      await deleteNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error if user is not admin', async () => {
      // Setup
      req.user.role = 'user';

      // Execute
      await deleteNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return error if notification not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Notification.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
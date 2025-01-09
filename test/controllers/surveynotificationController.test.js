const mongoose = require('mongoose');
const SurveyNotification = require('../../models/SurveyNotification');
const User = require('../../models/User');
const SurveySession = require('../../models/surveysession');
const SurveyQuiz = require('../../models/surveyQuiz');
const mailService = require('../../services/mailService');

// Mock all dependencies
jest.mock('../../models/SurveyNotification');
jest.mock('../../models/User');
jest.mock('../../models/surveysession');
jest.mock('../../models/surveyQuiz');
jest.mock('../../services/mailService');

const {
  createSurveyNotification,
  getSurveyNotificationsByUserId,
  markSurveyNotificationAsRead,
  deleteSurveyNotification
} = require('../../controllers/surveyNotificationController');

describe('Survey Notification Controller', () => {
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

  describe('createSurveyNotification', () => {
    const mockSessionData = {
      _id: 'session123',
      surveyQrData: 'mockQRData',
      surveyJoinCode: '123456',
      surveyQuiz: {
        title: 'Test Survey'
      }
    };

    it('should create survey invitation notifications successfully', async () => {
      // Setup
      req.body = {
        message: 'Test survey invitation',
        type: 'Survey-Invitation',
        sessionId: 'session123',
        users: ['user1', 'user2']
      };

      SurveySession.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSessionData)
        })
      });

      User.findById.mockImplementation((id) => ({
        _id: id,
        email: 'test@example.com',
        username: 'testuser'
      }));

      SurveyNotification.insertMany.mockResolvedValue([]);

      // Execute
      await createSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Survey notifications sent successfully.'
      }));
      expect(mailService.sendSurveyInvitationMail).toHaveBeenCalled();
      expect(mockIo.emit).toHaveBeenCalledWith('send-survey-notification', expect.any(Object));
    });

    it('should create session update notifications successfully', async () => {
      // Setup
      req.body = {
        type: 'Survey-session_update',
        sessionId: 'session123'
      };

      SurveySession.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSessionData)
        })
      });

      SurveyNotification.find.mockResolvedValue([
        { user: 'user1' },
        { user: 'user2' }
      ]);

      // Execute
      await createSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mailService.sendSurveySessionUpdateMail).toHaveBeenCalled();
    });

    it('should return error if user is not admin', async () => {
      // Setup
      req.user.role = 'user';

      // Execute
      await createSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Admins only.'
      });
    });

    it('should return error if notification type is invalid', async () => {
      // Setup
      req.body = {
        type: 'invalid-type',
        sessionId: 'session123'
      };

      // Execute
      await createSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid notification type.'
      });
    });
  });

  describe('getSurveyNotificationsByUserId', () => {
    it('should get survey notifications for authorized user', async () => {
      // Setup
      req.params.userId = 'user123';
      const mockNotifications = [
        {
          _id: 'notif1',
          message: 'Test survey notification',
          toObject: () => ({
            _id: 'notif1',
            message: 'Test survey notification'
          })
        }
      ];

      SurveyNotification.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockNotifications)
      });

      SurveySession.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            surveyQrData: 'mockQRData',
            surveyJoinCode: '123456',
            surveyQuiz: { title: 'Test Survey' }
          })
        })
      });

      // Execute
      await getSurveyNotificationsByUserId(req, res);

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
      await getSurveyNotificationsByUserId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('markSurveyNotificationAsRead', () => {
    it('should mark survey notification as read successfully', async () => {
      // Setup
      req.params.id = 'notif123';
      SurveyNotification.findOneAndUpdate.mockResolvedValue({
        _id: 'notif123',
        read: true
      });

      // Execute
      await markSurveyNotificationAsRead(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockIo.emit).toHaveBeenCalledWith('mark-survey-notification-read', expect.any(Object));
    });

    it('should return error if notification not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      SurveyNotification.findOneAndUpdate.mockResolvedValue(null);

      // Execute
      await markSurveyNotificationAsRead(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSurveyNotification', () => {
    it('should delete survey notification successfully', async () => {
      // Setup
      req.params.id = 'notif123';
      SurveyNotification.findByIdAndDelete.mockResolvedValue({
        _id: 'notif123'
      });

      // Execute
      await deleteSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey notification deleted successfully'
      });
    });

    it('should return error if user is not admin', async () => {
      // Setup
      req.user.role = 'user';

      // Execute
      await deleteSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Admins only.'
      });
    });

    it('should return error if notification not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      SurveyNotification.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteSurveyNotification(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey notification not found'
      });
    });
  });
});
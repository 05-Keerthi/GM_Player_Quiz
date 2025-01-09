const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

// Mock transporter that will be used by the mailService
const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({
  sendMail: mockSendMail
});

// Import mail service after mocking
const mailService = require('../../services/mailService');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('Mail Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Setup environment variables
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendWelcomeEmail('user@example.com', 'testUser');
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Welcome to GM Play!',
        text: expect.stringContaining('Hi testUser')
      });
    });
  });

  describe('sendResetCode', () => {
    it('should send reset code email with correct parameters', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendResetCode('user@example.com', '123456');
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Password Reset Code for GMPlay',
        text: expect.stringContaining('123456')
      });
    });
  });

  describe('sendPasswordResetConfirmation', () => {
    it('should send password reset confirmation email', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendPasswordResetConfirmation('user@example.com', 'testUser');
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Password Changed Successfully for GMPlay ',
        text: expect.stringContaining('Hi testUser')
      });
    });
  });

  describe('sendInviteEmail', () => {
    it('should send invite email with credentials', async () => {
      const credentials = {
        username: 'testUser',
        email: 'user@example.com',
        password: 'testPass123'
      };
      
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendInviteEmail(
        'user@example.com',
        'Test Org',
        'http://example.com/invite',
        credentials
      );
      
      const expectedText = `Hi testUser,

      You have been invited to join Test Org as the admin.

      Here are your credentials:
      - Username: testUser
      - Email: user@example.com
      - Password: testPass123

      Please use the link below to complete your registration and access your dashboard:
      http://example.com/invite

      We recommend changing your password immediately after logging in for security purposes.

      If you have any questions or need assistance, feel free to contact our support team.

      Best regards,
      GM Play Team`;
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Welcome to Test Org as Admin',
        text: expectedText
      });
    });
  });


  describe('sendQuizInvitationMail', () => {
    it('should send quiz invitation email with join code', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendQuizInvitationMail(
        'user@example.com',
        'testUser',
        'Math Quiz',
        'QUIZ123'
      );
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Invitation to Join the "Math Quiz" Quiz!',
        text: expect.stringContaining('QUIZ123')
      });
    });
  });

  describe('sendQuizResultMail', () => {
    it('should send quiz result email with score and rank', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      await mailService.sendQuizResultMail(
        'user@example.com',
        'testUser',
        'Math Quiz',
        95,
        1
      );
      
      const expectedText = `Hello testUser,

Your quiz result for the "Math Quiz" quiz is ready! Here are the details:

Score: 95
Rank: 1

Thank you for participating in the quiz!

Best regards,
The GM Play Team`;
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Your Quiz Result for "Math Quiz"',
        text: expectedText
      });
    });
  });

  describe('sendSurveyInvitationMail', () => {
    it('should send survey invitation email and return true on success', async () => {
      mockSendMail.mockResolvedValueOnce('Success');
      
      const result = await mailService.sendSurveyInvitationMail(
        'user@example.com',
        'testUser',
        'Feedback Survey',
        'qrCodeData',
        'SURVEY123'
      );
      
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Invitation to Join the "Feedback Survey" Survey!',
        text: expect.stringContaining('SURVEY123')
      });
    });

    it('should return false on error', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Send failed'));
      
      const result = await mailService.sendSurveyInvitationMail(
        'user@example.com',
        'testUser',
        'Feedback Survey',
        'qrCodeData',
        'SURVEY123'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle nodemailer errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Failed to send email'));
      
      await expect(
        mailService.sendWelcomeEmail('user@example.com', 'testUser')
      ).rejects.toThrow('Failed to send email');
    });
  });
});
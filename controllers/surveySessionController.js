const SurveySession = require('../models/surveySession');
const SurveyQuiz = require('../models/surveyQuiz');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');

// Create a new survey session
exports.createSurveySession = async (req, res) => {
    const { surveyQuizId } = req.params; // Extract survey quiz ID from the route params
    const surveyHostId = req.user._id; // Extract the user ID of the session host

    try {
        // Check if the SurveyQuiz exists
        const surveyQuiz = await SurveyQuiz.findById(surveyQuizId).populate('questions');
        if (!surveyQuiz) {
            return res.status(404).json({ message: 'Survey quiz not found' });
        }

        // Generate a random join code
        const surveyJoinCode = crypto.randomInt(100000, 999999).toString();

        // Create a new survey session without QR data initially
        const surveySession = new SurveySession({
            surveyQuiz: surveyQuizId,
            surveyHost: surveyHostId,
            surveyJoinCode,
            surveyStatus: 'waiting',
            surveyQuestions: surveyQuiz.questions, // Add questions from the quiz
        });

        // Save the session to the database
        const savedSurveySession = await surveySession.save();

        // Generate QR data for the session
        const qrData = `${req.protocol}://${req.get('host')}/api/survey-sessions/${surveyJoinCode}/${savedSurveySession._id}/join`;

        // Generate a QR code image as base64
        const qrCodeImageUrl = await QRCode.toDataURL(qrData);

        // Update the session with the QR data
        savedSurveySession.surveyQrData = qrData;
        await savedSurveySession.save();

        // Populate the session details for the response
        const populatedSurveySession = await SurveySession.findById(savedSurveySession._id)
            .populate('surveyHost', 'username email')
            .populate({
                path: 'surveyQuestions',
                populate: {
                    path: 'imageUrl',
                    model: 'Media',
                },
            })
            .populate('surveyQuiz', 'title description');

        // Emit the event via socket (optional)
        const io = req.app.get('socketio');
        io.emit('create-survey-session', {
            sessionId: populatedSurveySession._id,
            joinCode: populatedSurveySession.surveyJoinCode,
        });

        // Send the response
        res.status(201).json({
            _id: populatedSurveySession._id,
            surveyQuiz: populatedSurveySession.surveyQuiz,
            surveyHost: populatedSurveySession.surveyHost,
            surveyJoinCode: populatedSurveySession.surveyJoinCode,
            surveyQrData: populatedSurveySession.surveyQrData,
            qrCodeImageUrl,
            surveyStatus: populatedSurveySession.surveyStatus,
            surveyQuestions: populatedSurveySession.surveyQuestions,
            createdAt: populatedSurveySession.createdAt,
        });
    } catch (error) {
        console.error('Error creating survey session:', error);
        res.status(500).json({ message: 'Error creating the survey session', error });
    }
};

exports.joinSurveySession = async (req, res) => {
    const { joinCode } = req.params;
    const userId = req.user._id;
  
    try {
      // Find the session using the join code
      let session = await SurveySession.findOne({ surveyJoinCode: joinCode })
        .populate('surveyPlayers', 'username email')
        .populate('surveyHost', 'username email')
        .populate('surveyQuiz');
  
      if (!session) {
        return res.status(404).json({ message: 'Survey session not found' });
      }
  
      // Check if the session is open for joining
      if (session.surveyStatus !== 'waiting') {
        return res.status(400).json({ message: 'Survey session is not open for joining' });
      }
  
      // Check if the user has already joined the session
      if (session.surveyPlayers.some((player) => player._id.toString() === userId.toString())) {
        return res.status(400).json({ message: 'User has already joined this session' });
      }
  
      // Get user details
      const user = await User.findById(userId).select('username email');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Add the user to the session's players
      session.surveyPlayers.push(userId);
      await session.save();
  
      // Refresh the populated session
      session = await SurveySession.findById(session._id)
        .populate('surveyPlayers', 'username email')
        .populate('surveyHost', 'username email')
        .populate('surveyQuiz');
  
      // Emit the join event using socket.io
      const io = req.app.get('socketio');
      io.emit('player-joined-survey', { sessionId: session._id, user });
  
      res.status(200).json({
        message: 'User successfully joined the survey session',
        session,
      });
    } catch (error) {
      console.error('Error joining survey session:', error);
      res.status(500).json({ message: 'Error joining survey session', error });
    }
  };
const mongoose = require('mongoose');
const Answer = require('../models/answer');
const Question = require('../models/question');
const Session = require('../models/session');
const Leaderboard = require('../models/leaderBoard');

const calculateScore = (timeTaken, questionTimer, basePoints) => {
  const timeBonus = Math.max(0, questionTimer - timeTaken);
  return basePoints + timeBonus;
};

exports.submitAnswer = async (req, res) => {
    const { sessionId, questionId } = req.params;
    const { answer, timeTaken } = req.body;
    const userId = req.user.id;
  
    try {
      // Validate session existence and status
      const session = await Session.findOne({ _id: sessionId, status: 'in_progress' });
      if (!session) {
        return res.status(404).json({ message: 'Session not found or not in progress' });
      }
  
      // Validate question existence
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      // Check if the user has already answered this question in the session
      const existingAnswer = await Answer.findOne({ user: userId, session: sessionId, question: questionId });
      if (existingAnswer) {
        return res.status(400).json({ message: 'You have already answered this question' });
      }
  
      // Validate timeTaken
      if (typeof timeTaken !== 'number' || timeTaken < 0) {
        return res.status(400).json({ message: 'Invalid time taken' });
      }
  
      // Validate the answer based on the question type
      if (question.type === 'multiple_select' && !Array.isArray(answer)) {
        return res.status(400).json({ message: 'Answer must be an array for multiple_select questions' });
      } else if (['multiple_choice', 'true_false', 'open_ended', 'poll'].includes(question.type) && typeof answer !== 'string') {
        return res.status(400).json({ message: 'Answer must be a string for this question type' });
      }
  
      // Infer answerType from question type
      const answerTypeMap = {
        multiple_choice: 'option',
        multiple_select: 'option',
        true_false: 'boolean',
        open_ended: 'text',
        poll: 'text',
      };
  
      const answerType = answerTypeMap[question.type];
  
      // If answerType is invalid or unsupported
      if (!answerType) {
        return res.status(400).json({ message: 'Unsupported question type or invalid mapping' });
      }
  
      // Determine if the answer is correct
      let isCorrect = false;
      if (answerType === 'option') {
        if (Array.isArray(answer)) {
          isCorrect = question.options.every(opt => answer.includes(opt.text) && opt.isCorrect);
        } else {
          isCorrect = question.options.some(opt => opt.text === answer && opt.isCorrect);
        }
      } else if (answerType === 'boolean') {
        isCorrect = question.correctAnswer.includes(answer);
      } else if (answerType === 'text') {
        isCorrect = question.correctAnswer.some(correctAnswer => correctAnswer.toLowerCase() === answer.toLowerCase());
      }

          // Calculate score based on correctness and time taken
          const pointsAwarded = isCorrect
          ? calculateScore(timeTaken, question.timer, question.points)
          : 0;

      // Save the answer
      const newAnswer = await Answer.create({
        question: questionId,
        user: userId,
        session: sessionId,
        answerType,
        answer,
        isCorrect,
        timeTaken,
      });

      // Emit socket event
      const io = req.app.get('socketio');
      io.to(sessionId).emit('answer-updated', {
        sessionId,
        questionId,
        answer: {
          userId,
          answer,
          isCorrect,
          timeTaken,
        },
      });
  
      // Update the leaderboard
      // const pointsAwarded = isCorrect ? question.points : 0;
      const leaderboardEntry = await Leaderboard.findOne({ session: sessionId, player: userId });
  
      if (leaderboardEntry) {
        leaderboardEntry.score += pointsAwarded;
        await leaderboardEntry.save();
      } else {
        await Leaderboard.create({
          session: sessionId,
          player: userId,
          score: pointsAwarded,
        });
      }
  
      // Recalculate ranks
      const allLeaderboardEntries = await Leaderboard.find({ session: sessionId }).sort({ score: -1 });
      allLeaderboardEntries.forEach(async (entry, index) => {
        entry.rank = index + 1;
        await entry.save();
      });
  
      // Populate the user details
      const populatedAnswer = await Answer.findById(newAnswer._id).populate({
        path: 'user',
        select: 'username email mobile role tenantId', // Select only necessary fields
      });
  
      // Return response
      res.status(201).json({
        message: 'Answer submitted successfully',
        answer: populatedAnswer,
      });
    } catch (error) {
      console.error('Error Details:', error); // Log detailed error
      res.status(500).json({ message: 'Error submitting answer', error });
    }
  };

exports.getSessionAnswers = async (req, res) => {
    const { sessionId } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
  
    try {
      const session = await Session.findOne({ _id: sessionId, status: 'in_progress' });
      if (!session) {
        return res.status(404).json({ message: 'Session not found or not in progress' });
      }
  
      const answers = await Answer.find({ session: sessionId }).populate('question user');
  
      if (!answers || answers.length === 0) {
        return res.status(404).json({ message: 'No answers found for this session' });
      }
  
      const answerSummary = {};
  
      answers.forEach(answer => {
        const questionId = answer.question._id.toString();
        const question = answer.question;
  
        if (!answerSummary[questionId]) {
          answerSummary[questionId] = {
            totalUsers: 0,
            correctCount: 0,
            incorrectCount: 0,
            totalPoints: 0,
            correctAnswers: [],
            incorrectAnswers: [],
          };
        }
  
        answerSummary[questionId].totalUsers++;
  
        const isCorrect = answer.isCorrect;
        const points = isCorrect ? question.points : 0;
        answerSummary[questionId].totalPoints += points;
  
        if (isCorrect) {
          answerSummary[questionId].correctCount++;
          answerSummary[questionId].correctAnswers.push({
            user: answer.user,
            answer: answer.answer,
            points,
          });
        } else {
          answerSummary[questionId].incorrectCount++;
          answerSummary[questionId].incorrectAnswers.push({
            user: answer.user,
            answer: answer.answer,
            points,
          });
        }
      });
  
      const result = [];
  
      for (const [questionId, summary] of Object.entries(answerSummary)) {
        const question = await Question.findById(questionId);
  
        if (!question) {
          return res.status(404).json({ message: `Question with ID ${questionId} not found` });
        }
  
        result.push({
          question: {
            _id: questionId,
            text: question.questionText,
            type: question.type,
            pointsPerQuestion: question.points,
          },
          totalUsers: summary.totalUsers,
          correctCount: summary.correctCount,
          incorrectCount: summary.incorrectCount,
          totalPointsAwarded: summary.totalPoints,
          correctAnswers: summary.correctAnswers.map(answer => ({
            user: {
              username: answer.user.username,
              email: answer.user.email,
              mobile: answer.user.mobile,
            },
            answer: answer.answer,
            points: answer.points,
          })),
          incorrectAnswers: summary.incorrectAnswers.map(answer => ({
            user: {
              username: answer.user.username,
              email: answer.user.email,
              mobile: answer.user.mobile,
            },
            answer: answer.answer,
            points: answer.points,
          })),
        });
      }
  
      res.status(200).json({
        message: 'Answers summary fetched successfully',
        result: result,
      });
    } catch (error) {
      console.error('Error fetching answers:', error);
      res.status(500).json({ message: 'Error fetching answers', error });
    }
  };
  


  exports.getAnswersForQuestionInSession = async (req, res) => {
    const { sessionId, questionId } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
  
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID format' });
    }
  
    try {
      const session = await Session.findOne({ _id: sessionId, status: 'in_progress' });
      if (!session) {
        return res.status(404).json({ message: 'Session not found or not in progress' });
      }
  
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      const answers = await Answer.find({ session: sessionId, question: questionId }).populate('user');
  
      if (!answers || answers.length === 0) {
        return res.status(404).json({ message: 'No answers found for this question within the session' });
      }
  
      const result = answers.map(answer => {
        const awardedPoints = answer.isCorrect ? question.points : 0;
  
        return {
          user: {
            username: answer.user.username,
            email: answer.user.email,
            mobile: answer.user.mobile,
          },
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          timeTaken: answer.timeTaken,
          points: awardedPoints,
        };
      });
  
      res.status(200).json({
        message: 'Answers for the question fetched successfully',
        question: {
          id: question._id,
          text: question.questionText,
          points: question.points,
        },
        answers: result,
      });
    } catch (error) {
      console.error('Error fetching answers for the question:', error);
      res.status(500).json({ message: 'Error fetching answers for the question', error });
    }
  };


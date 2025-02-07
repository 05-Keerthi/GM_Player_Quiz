const SurveyAnswer = require("../models/surveyanswer");
const SurveySession = require("../models/surveysession");
const SurveyQuestion = require("../models/surveyQuestion");
const Media = require("../models/Media");
const { getFileUrl } = require("../utils/urlHelper");

// submitSurveyAnswer remains unchanged as it doesn't handle image URLs
exports.submitSurveyAnswer = async (req, res) => {
  const { sessionId, questionId } = req.params;
  const { answer, timeTaken } = req.body;
  const userId = req.user?._id || req.body.guestUserId;

  try {
    const session = await SurveySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "in_progress") {
      return res
        .status(400)
        .json({ message: "Survey session is not in progress" });
    }

    const question = await SurveyQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    const existingAnswer = await SurveyAnswer.findOne({
      surveyQuestion: questionId,
      surveyPlayers: userId,
      surveySession: sessionId,
    });

    let surveyAnswer;
    let message;

    if (existingAnswer) {
      existingAnswer.surveyAnswer = answer;
      existingAnswer.timeTaken = timeTaken;
      existingAnswer.updatedAt = new Date();
      surveyAnswer = await existingAnswer.save();
      message = "Answer updated successfully";
    } else {
      surveyAnswer = new SurveyAnswer({
        surveyQuestion: questionId,
        surveyPlayers: userId,
        surveySession: sessionId,
        surveyAnswer: answer,
        timeTaken,
      });
      await surveyAnswer.save();
      message = "Answer submitted successfully";
    }

    const io = req.app.get("socketio");
    io.emit("survey-submit-answer", {
      sessionId,
      questionId,
      userId,
      answer,
      timeTaken,
      isUpdate: !!existingAnswer,
    });

    res.status(200).json({
      message,
      surveyAnswer,
    });
  } catch (error) {
    console.error("Error submitting survey answer:", error);
    res.status(500).json({ message: "Error submitting survey answer", error });
  }
};

exports.getAllAnswersForSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await SurveySession.findById(sessionId).populate({
      path: "surveyQuiz",
      select: "title description type category",
    });

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    const answers = await SurveyAnswer.find({ surveySession: sessionId })
      .populate({
        path: "surveyQuestion",
        populate: {
          path: "imageUrl",
          model: "Media",
        },
      })
      .populate("surveyPlayers", "username email")
      .sort({ createdAt: 1 });

    if (answers.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this session" });
    }

    const questionsMap = {};
    const userAnswers = {};
    const groupedAnswersByQuestion = {};

    answers.forEach((answer) => {
      const question = answer.surveyQuestion.toObject();

      // Format the image URL using getFileUrl utility
      if (question.imageUrl && question.imageUrl.path) {
        const filename = question.imageUrl.path.split(/[\/\\]/).pop();
        question.imageUrl = getFileUrl(filename);
      }

      if (!questionsMap[question._id]) {
        questionsMap[question._id] = question;
      }

      if (!groupedAnswersByQuestion[question._id]) {
        groupedAnswersByQuestion[question._id] = {};
      }

      const option = answer.surveyAnswer;
      if (option.trim() === "") return;

      if (!groupedAnswersByQuestion[question._id][option]) {
        groupedAnswersByQuestion[question._id][option] = {
          count: 0,
          users: [],
        };
      }

      groupedAnswersByQuestion[question._id][option].count += 1;
      groupedAnswersByQuestion[question._id][option].users.push({
        username: answer.surveyPlayers.username,
        email: answer.surveyPlayers.email,
        timeTaken: answer.timeTaken,
      });

      const userId = answer.surveyPlayers._id.toString();
      if (!userAnswers[userId]) {
        userAnswers[userId] = {
          user: {
            _id: answer.surveyPlayers._id,
            username: answer.surveyPlayers.username,
            email: answer.surveyPlayers.email,
          },
          answers: [],
        };
      }

      userAnswers[userId].answers.push({
        questionId: question._id,
        answer: answer.surveyAnswer,
        timeTaken: answer.timeTaken,
      });
    });

    res.status(200).json({
      message: "Answers retrieved successfully",
      surveyDetails: {
        _id: session.surveyQuiz._id,
        title: session.surveyQuiz.title,
        description: session.surveyQuiz.description,
        Type: session.surveyQuiz.type,
        category: session.surveyQuiz.category,
        createdAt: session.surveyQuiz.createdAt,
        sessionStatus: session.surveyStatus,
      },
      questions: Object.values(questionsMap),
      userAnswers: Object.values(userAnswers),
      groupedAnswers: groupedAnswersByQuestion,
    });
  } catch (error) {
    console.error("Get all answers for session error:", error);
    res.status(500).json({
      message: "Error retrieving answers for the session",
      error,
    });
  }
};

exports.getAnswersForSpecificQuestion = async (req, res) => {
  const { sessionId, questionId } = req.params;

  try {
    const session = await SurveySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    const surveyQuestion = await SurveyQuestion.findById(questionId)
      .populate("surveyQuiz", "title description")
      .populate("imageUrl", "path");

    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    let imageUrl = null;
    if (surveyQuestion.imageUrl && surveyQuestion.imageUrl.path) {
      const filename = surveyQuestion.imageUrl.path.split(/[\/\\]/).pop();
      imageUrl = getFileUrl(filename);
    }

    const answers = await SurveyAnswer.find({
      surveySession: sessionId,
      surveyQuestion: questionId,
    })
      .populate("surveyPlayers", "username email")
      .sort({ createdAt: 1 });

    if (answers.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this question in the session" });
    }

    const groupedAnswers = answers.reduce((acc, answer) => {
      const option = answer.surveyAnswer;
      if (!acc[option]) {
        acc[option] = { count: 0, users: [] };
      }
      acc[option].count += 1;
      acc[option].users.push({
        username: answer.surveyPlayers.username,
        email: answer.surveyPlayers.email,
        timeTaken: answer.timeTaken,
      });
      return acc;
    }, {});

    const questionDetails = {
      ...surveyQuestion.toObject(),
      imageUrl: imageUrl,
      answerOptions: surveyQuestion.answerOptions.map((opt) => ({
        optionText: opt.optionText,
        color: opt.color,
      })),
    };

    res.status(200).json({
      message: "Answers retrieved successfully for the specific question",
      question: questionDetails,
      groupedAnswers,
    });
  } catch (error) {
    console.error("Error retrieving answers for specific question:", error);
    res.status(500).json({
      message: "Error retrieving answers for the specific question",
      error,
    });
  }
};

const SurveyAnswer = require("../models/surveyanswer");
const SurveySession = require("../models/surveysession");
const SurveyQuestion = require("../models/surveyQuestion");
const Media = require("../models/Media");

exports.submitSurveyAnswer = async (req, res) => {
  const { sessionId, questionId } = req.params;
  const { answer, timeTaken } = req.body;
  const userId = req.user?._id || req.body.guestUserId;

  try {
    // Verify the session exists and is in progress
    const session = await SurveySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "in_progress") {
      return res.status(400).json({ message: "Survey session is not in progress" });
    }

    // Verify the question exists
    const question = await SurveyQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    // Check if the user has already answered this question in this session
    const existingAnswer = await SurveyAnswer.findOne({
      surveyQuestion: questionId,
      surveyPlayers: userId,
      surveySession: sessionId,
    });

    let surveyAnswer;
    let message;

    if (existingAnswer) {
      // Update existing answer
      existingAnswer.surveyAnswer = answer;
      existingAnswer.timeTaken = timeTaken;
      existingAnswer.updatedAt = new Date();
      surveyAnswer = await existingAnswer.save();
      message = "Answer updated successfully";
    } else {
      // Create new answer
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

    // Emit the 'survey-submit-answer' event to notify other clients
    const io = req.app.get("socketio");
    io.emit("survey-submit-answer", {
      sessionId,
      questionId,
      userId,
      answer,
      timeTaken,
      isUpdate: !!existingAnswer,
    });

    // Respond with a success message
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
    // Verify the session exists
    const session = await SurveySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Retrieve all answers for the session
    const answers = await SurveyAnswer.find({ surveySession: sessionId })
      .populate({
        path: "surveyQuestion",
        populate: {
          path: "imageUrl",
          model: "Media",
        },
      }) // Populate all details of surveyQuestion including imageUrl
      .populate("surveyPlayers", "username email")
      .sort({ createdAt: 1 });

    if (answers.length === 0) {
            return res.status(404).json({ message: "No answers found for this session" });
    }

        const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;
    const questionsMap = {};
    const userAnswers = {};
    const groupedAnswersByQuestion = {};

        answers.forEach(answer => {
      const question = answer.surveyQuestion.toObject();

      // Format the image URL if available
      if (question.imageUrl) {
                const encodedImagePath = encodeURIComponent(question.imageUrl.path.split("\\").pop());
        question.imageUrl = `${baseUrl}${encodedImagePath}`;
      }

      // Add question to the map if not already added
      if (!questionsMap[question._id]) {
        questionsMap[question._id] = question;
      }

      // Group answers by question
      if (!groupedAnswersByQuestion[question._id]) {
        groupedAnswersByQuestion[question._id] = {};
      }

      const option = answer.surveyAnswer;
      if (!groupedAnswersByQuestion[question._id][option]) {
                groupedAnswersByQuestion[question._id][option] = { count: 0, users: [] };
      }

      groupedAnswersByQuestion[question._id][option].count += 1;
      groupedAnswersByQuestion[question._id][option].users.push({
        username: answer.surveyPlayers.username,
        email: answer.surveyPlayers.email,
        timeTaken: answer.timeTaken,
      });

      // Add user and their answer to the userAnswers map
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

    // Construct the response object
    res.status(200).json({
      message: "Answers retrieved successfully",
      questions: Object.values(questionsMap),
      userAnswers: Object.values(userAnswers),
      groupedAnswers: groupedAnswersByQuestion, // Grouped counts and users for each question
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
    // Verify the session exists
    const session = await SurveySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Find the survey question
      const surveyQuestion = await SurveyQuestion.findById(questionId).populate("surveyQuiz", "title description");

    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    // Base URL for constructing the full image path
      const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;
    let fullImageUrl = null;

    // If the question has an image URL, fetch the image details from Media model
    if (surveyQuestion.imageUrl) {
      const image = await Media.findById(surveyQuestion.imageUrl);
      if (image) {
          const encodedImagePath = encodeURIComponent(image.path.split("\\").pop());
        fullImageUrl = `${baseUrl}${encodedImagePath}`;
      }
    }

    // Retrieve all answers for the specific question in the session
    const answers = await SurveyAnswer.find({
      surveySession: sessionId,
      surveyQuestion: questionId,
    })
      .populate("surveyPlayers", "username email")
      .sort({ createdAt: 1 });

    if (answers.length === 0) {
        return res.status(404).json({ message: "No answers found for this question in the session" });
    }

    // Group answers by the option clicked and count how many users selected each option
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

    // Include the question details in the response
    const questionDetails = {
      ...surveyQuestion.toObject(),
      imageUrl: fullImageUrl || surveyQuestion.imageUrl,
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
  
  
  

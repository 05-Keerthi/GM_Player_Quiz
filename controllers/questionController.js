const Question = require("../models/question");
const Quiz = require("../models/quiz");
const Media = require("../models/Media");
const { getFileUrl } = require("../utils/urlHelper");

exports.addQuestion = async (req, res) => {
  const { quizId } = req.params;
  const { title, type, imageUrl, options, correctAnswer, points, timer } =
    req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let fullImageUrl = null;

    if (imageUrl) {
      const image = await Media.findById(imageUrl);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const filename = image.path.split(/[\/\\]/).pop();
      fullImageUrl = getFileUrl(filename);
    }

    const formattedOptions = options.map((opt) => ({
      text: opt.text,
      color: opt.color || null,
      isCorrect: opt.isCorrect || false,
    }));

    const newQuestion = new Question({
      quiz: quizId,
      title,
      type,
      imageUrl: imageUrl || null,
      options: formattedOptions,
      correctAnswer,
      points: points || 10,
      timer: timer || 10,
    });

    await newQuestion.save();

    quiz.questions.push(newQuestion._id);
    await quiz.save();

    const responseQuestion = {
      ...newQuestion.toObject(),
      imageUrl: fullImageUrl,
    };

    res.status(201).json(responseQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMediaIdFromPath = async (imageUrl) => {
  try {
    if (!imageUrl) return null;

    if (typeof imageUrl === "string" && !imageUrl.includes("/")) {
      return imageUrl;
    }

    const filename = decodeURIComponent(imageUrl).split("/").pop();
    const media = await Media.findOne({
      path: { $regex: new RegExp(filename + "$") },
    });

    return media ? media._id : null;
  } catch (error) {
    console.error("Error getting media ID:", error);
    return null;
  }
};

exports.getQuestions = async (req, res) => {
  const { quizId } = req.params;

  try {
    const questions = await Question.find({ quiz: quizId }).populate(
      "imageUrl",
      "path"
    );

    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this quiz" });
    }

    const questionsWithFullImageUrl = questions.map((question) => {
      const questionObj = question.toObject();
      if (questionObj.imageUrl && questionObj.imageUrl.path) {
        const filename = questionObj.imageUrl.path.split(/[\/\\]/).pop();
        questionObj.imageUrl = getFileUrl(filename);
      }
      return questionObj;
    });

    res.status(200).json(questionsWithFullImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getQuestionById = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await Question.findById(id).populate("imageUrl", "path");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const questionObj = question.toObject();
    if (questionObj.imageUrl && questionObj.imageUrl.path) {
      const filename = questionObj.imageUrl.path.split(/[\/\\]/).pop();
      questionObj.imageUrl = getFileUrl(filename);
    }

    res.status(200).json(questionObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { title, type, imageUrl, options, correctAnswer, points, timer } =
    req.body;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    let mediaId = null;
    if (imageUrl !== null && imageUrl !== undefined) {
      mediaId = await getMediaIdFromPath(imageUrl);
    }

    question.title = title || question.title;
    question.type = type || question.type;
    question.imageUrl = imageUrl === null ? null : mediaId || question.imageUrl;
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;
    question.points = points || question.points;
    question.timer = timer || question.timer;

    await question.save();

    let fullImageUrl = null;
    if (question.imageUrl) {
      const media = await Media.findById(question.imageUrl);
      if (media) {
        const filename = media.path.split(/[\/\\]/).pop();
        fullImageUrl = getFileUrl(filename);
      }
    }

    res.status(200).json({
      message: "Question updated successfully",
      question: {
        ...question.toObject(),
        imageUrl: imageUrl === null ? null : fullImageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await Question.deleteOne({ _id: id });
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

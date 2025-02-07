const Quiz = require("../models/quiz");
const Category = require("../models/category");
const Slide = require("../models/slide");
const Question = require("../models/question");
const User = require("../models/User");
const Media = require("../models/Media");
const ActivityLog = require("../models/ActivityLog");
const { getFileUrl } = require("../utils/urlHelper");

exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      slides,
      questions,
      tenantId,
      duration,
      order,
    } = req.body;

    if (!categoryId || !Array.isArray(categoryId) || categoryId.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one Category ID is required." });
    }

    const categoryIds = await Category.find({ _id: { $in: categoryId } });
    if (categoryIds.length !== categoryId.length) {
      return res.status(400).json({ message: "Some categories are invalid." });
    }

    const slideIds = await Slide.find({ _id: { $in: slides || [] } });
    if (slides && slideIds.length !== slides.length) {
      return res.status(400).json({ message: "Some slides are invalid." });
    }

    const questionIds = await Question.find({ _id: { $in: questions || [] } });
    if (questions && questionIds.length !== questions.length) {
      return res.status(400).json({ message: "Some questions are invalid." });
    }

    const mixedOrder = [];
    if (order && Array.isArray(order)) {
      for (const item of order) {
        const { id, type } = item;
        if (type === "slide" && slides.includes(id)) {
          mixedOrder.push({ id, type });
        } else if (type === "question" && questions.includes(id)) {
          mixedOrder.push({ id, type });
        } else {
          return res
            .status(400)
            .json({ message: `Invalid order entry: ${JSON.stringify(item)}` });
        }
      }
    }

    const quiz = new Quiz({
      title,
      description,
      categories: categoryId,
      slides,
      questions,
      order: mixedOrder,
      tenantId,
      createdBy: req.user._id,
      status: "draft",
      duration,
    });

    await quiz.save();

    const activityLog = new ActivityLog({
      user: req.user._id,
      activityType: "quiz_create",
      details: {
        username: req.user.username,
        email: req.user.email,
        mobile: req.user.mobile,
        quizTitle: title,
        quizDescription: description,
        tenantId,
        duration,
      },
      createdAt: new Date(),
    });

    await activityLog.save();

    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("categories")
      .populate("slides")
      .populate("questions")
      .populate("questions.imageUrl")
      .populate("slides.imageUrl");

    const quizzesWithImageUrls = await Promise.all(
      quizzes.map(async (quiz) => {
        const slidesWithImageUrls = await Promise.all(
          quiz.slides.map(async (slide) => {
            let fullImageUrl = null;
            if (slide.imageUrl) {
              const media = await Media.findById(slide.imageUrl);
              if (media && media.path) {
                const filename = media.path.split(/[\/\\]/).pop();
                fullImageUrl = getFileUrl(filename);
              }
            }
            return {
              ...slide.toObject(),
              imageUrl: fullImageUrl,
            };
          })
        );

        const questionsWithImageUrls = await Promise.all(
          quiz.questions.map(async (question) => {
            let fullImageUrl = null;
            if (question.imageUrl) {
              const media = await Media.findById(question.imageUrl);
              if (media && media.path) {
                const filename = media.path.split(/[\/\\]/).pop();
                fullImageUrl = getFileUrl(filename);
              }
            }
            return {
              ...question.toObject(),
              imageUrl: fullImageUrl,
            };
          })
        );

        return {
          ...quiz.toObject(),
          slides: slidesWithImageUrls,
          questions: questionsWithImageUrls,
        };
      })
    );

    res.status(200).json(quizzesWithImageUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("categories")
      .populate("slides")
      .populate("questions");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const slidesWithImageUrls = await Promise.all(
      quiz.slides.map(async (slide) => {
        let fullImageUrl = null;
        if (slide.imageUrl) {
          const media = await Media.findById(slide.imageUrl);
          if (media && media.path) {
            const filename = media.path.split(/[\/\\]/).pop();
            fullImageUrl = getFileUrl(filename);
          }
        }
        return {
          ...slide.toObject(),
          imageUrl: fullImageUrl,
        };
      })
    );

    const questionsWithImageUrls = await Promise.all(
      quiz.questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl);
          if (media && media.path) {
            const filename = media.path.split(/[\/\\]/).pop();
            fullImageUrl = getFileUrl(filename);
          }
        }
        return {
          ...question.toObject(),
          imageUrl: fullImageUrl,
        };
      })
    );

    res.status(200).json({
      ...quiz.toObject(),
      slides: slidesWithImageUrls,
      questions: questionsWithImageUrls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz updated successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz published successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.closeQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz closed successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;

const Category = require("../models/category");
const SurveyQuestion = require("../models/surveyQuestion");
const SurveyQuiz = require("../models/surveyQuiz");
const SurveySlide = require("../models/surveySlide");
const Media = require("../models/Media");
const ActivityLog = require("../models/ActivityLog");
const { getFileUrl } = require("../utils/urlHelper");

exports.createSurveyQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      slides,
      questions,
      isPublic,
      order,
      type,
    } = req.body;

    if (!type || !["survey", "ArtPulse"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Valid type (survey or ArtPulse) is required." });
    }

    if (!categoryId || !Array.isArray(categoryId) || categoryId.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one Category ID is required." });
    }

    const categoryIds = await Category.find({ _id: { $in: categoryId } });
    if (categoryIds.length !== categoryId.length) {
      return res.status(400).json({ message: "Some categories are invalid." });
    }

    const slideIds = await SurveySlide.find({ _id: { $in: slides || [] } });
    if (slides && slideIds.length !== slides.length) {
      return res.status(400).json({ message: "Some slides are invalid." });
    }

    const questionIds = await SurveyQuestion.find({
      _id: { $in: questions || [] },
    });
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

    const surveyQuiz = new SurveyQuiz({
      title,
      description,
      categories: categoryId,
      slides,
      questions,
      order: mixedOrder,
      createdBy: req.user._id,
      status: "draft",
      isPublic,
      type,
    });

    await surveyQuiz.save();

    const activityLog = new ActivityLog({
      user: req.user._id,
      activityType: "survey_create",
      details: {
        username: req.user.username,
        email: req.user.email,
        mobile: req.user.mobile,
        surveyTitle: title,
        surveyDescription: description,
        type,
      },
      createdAt: new Date(),
    });

    await activityLog.save();

    const populatedSurveyQuiz = await SurveyQuiz.findById(surveyQuiz._id)
      .populate("categories")
      .populate("slides")
      .populate("questions");

    res.status(201).json({
      message: "SurveyQuiz created successfully",
      surveyQuiz: populatedSurveyQuiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllSurveyQuizzes = async (req, res) => {
  try {
    const surveyQuizzes = await SurveyQuiz.find()
      .populate("categories")
      .populate("slides")
      .populate("questions")
      .populate("questions.imageUrl")
      .populate("slides.imageUrl");

    const surveyQuizzesWithImageUrls = await Promise.all(
      surveyQuizzes.map(async (surveyQuiz) => {
        const slidesWithImageUrls = await Promise.all(
          surveyQuiz.slides.map(async (slide) => {
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
          surveyQuiz.questions.map(async (question) => {
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
          ...surveyQuiz.toObject(),
          slides: slidesWithImageUrls,
          questions: questionsWithImageUrls,
        };
      })
    );

    res.status(200).json(surveyQuizzesWithImageUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSurveyQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const surveyQuiz = await SurveyQuiz.findById(id)
      .populate("categories")
      .populate("slides")
      .populate("questions");

    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    const slidesWithImageUrls = await Promise.all(
      surveyQuiz.slides.map(async (slide) => {
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
      surveyQuiz.questions.map(async (question) => {
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
      ...surveyQuiz.toObject(),
      slides: slidesWithImageUrls,
      questions: questionsWithImageUrls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateSurveyQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, slides, questions, order, isPublic, status } =
      req.body;

    const surveyQuiz = await SurveyQuiz.findById(id);

    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    if (questions && questions.length > 0) {
      const questionRecords = await SurveyQuestion.find({
        _id: { $in: questions },
      });
      if (questionRecords.length !== questions.length) {
        return res
          .status(400)
          .json({ message: "Some question IDs are invalid" });
      }
      surveyQuiz.questions = questions;
    }

    if (slides && slides.length > 0) {
      const slideRecords = await SurveySlide.find({ _id: { $in: slides } });
      if (slideRecords.length !== slides.length) {
        return res.status(400).json({ message: "Some slide IDs are invalid" });
      }
      surveyQuiz.slides = slides;
    }

    if (title) surveyQuiz.title = title;
    if (description) surveyQuiz.description = description;
    if (isPublic !== undefined) surveyQuiz.isPublic = isPublic;
    if (status) surveyQuiz.status = status;
    if (order) surveyQuiz.order = order;

    const updatedSurveyQuiz = await surveyQuiz.save();

    res.status(200).json({
      message: "SurveyQuiz updated successfully",
      surveyQuiz: updatedSurveyQuiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteSurveyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const surveyQuiz = await SurveyQuiz.findById(id);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    await SurveyQuiz.deleteOne({ _id: id });
    res.status(200).json({ message: "SurveyQuiz deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.publishSurveyQuiz = async (req, res) => {
  try {
    const surveyQuiz = await SurveyQuiz.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    res.status(200).json({
      message: "Survey quiz published successfully",
      surveyQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.closeSurveyQuiz = async (req, res) => {
  try {
    const surveyQuiz = await SurveyQuiz.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );

    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    res.status(200).json({
      message: "Survey quiz closed successfully",
      surveyQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;

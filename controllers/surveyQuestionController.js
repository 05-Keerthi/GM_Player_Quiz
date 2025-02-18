const SurveyQuestion = require("../models/surveyQuestion");
const Media = require("../models/Media");
const SurveyQuiz = require("../models/surveyQuiz");
const mongoose = require("mongoose");
const { getFileUrl } = require("../utils/urlHelper");

exports.createSurveyQuestion = async (req, res) => {
  const { surveyquizId } = req.params;
  const {
    title,
    description,
    dimension,
    year,
    imageUrl,
    timer,
    answerOptions,
  } = req.body;

  if (
    !title ||
    !description ||
    !Array.isArray(answerOptions) ||
    answerOptions.length === 0
  ) {
    return res.status(400).json({
      message: "All fields are required, including at least one answer option.",
    });
  }

  let fullImageUrl = null;

  try {
    const surveyQuiz = await SurveyQuiz.findById(surveyquizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    if (imageUrl) {
      const image = await Media.findById(imageUrl);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const filename = image.path.split(/[\/\\]/).pop();
      fullImageUrl = getFileUrl(filename);
    }

    const formattedAnswerOptions = answerOptions.map((option) => ({
      optionText: option.optionText,
      color: option.color || "#ffffff",
    }));

    const newSurveyQuestion = new SurveyQuestion({
      title,
      description,
      dimension,
      year,
      imageUrl,
      timer: timer || 30,
      answerOptions: formattedAnswerOptions,
      surveyQuiz: surveyquizId,
    });

    const savedQuestion = await newSurveyQuestion.save();

    surveyQuiz.questions.push(savedQuestion._id);
    await surveyQuiz.save();

    const responseQuestion = {
      ...savedQuestion.toObject(),
      imageUrl: fullImageUrl || savedQuestion.imageUrl,
    };

    res.status(201).json({
      success: true,
      message: "Survey question created successfully",
      data: responseQuestion,
    });
  } catch (error) {
    console.error("Error creating survey question:", error);
    res.status(500).json({ message: "Error creating survey question", error });
  }
};

exports.addMultipleSurveyQuestions = async (req, res) => {
  const { surveyquizId } = req.params;
  const { questions } = req.body;

  try {
    // Validate survey quiz exists
    const surveyQuiz = await SurveyQuiz.findById(surveyquizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of survey questions",
      });
    }

    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;
    const savedSurveyQuestions = [];

    // Process each survey question
    for (const questionData of questions) {
      const {
        title,
        description,
        dimension,
        year,
        imageUrl,
        timer,
        answerOptions,
      } = questionData;

      let fullImageUrl = null;
      let mediaId = null;

      if (imageUrl) {
        const image = await Media.findById(imageUrl);
        if (image) {
          mediaId = image._id;
          const encodedImagePath = encodeURIComponent(
            image.path.split("\\").pop()
          );
          fullImageUrl = `${baseUrl}${encodedImagePath}`;
        }
      }

      // Format answer options with defaults
      const formattedAnswerOptions = answerOptions.map((opt) => ({
        optionText: opt.optionText,
        color: opt.color || "#ffffff", // Default color if not provided
      }));

      const newSurveyQuestion = new SurveyQuestion({
        title,
        description,
        dimension,
        year,
        imageUrl: mediaId,
        timer: timer || 30, // Default timer if not provided
        answerOptions: formattedAnswerOptions,
        surveyQuiz: surveyquizId,
      });

      await newSurveyQuestion.save();
      surveyQuiz.questions.push(newSurveyQuestion._id);

      savedSurveyQuestions.push({
        ...newSurveyQuestion.toObject(),
        imageUrl: fullImageUrl,
      });
    }

    await surveyQuiz.save();

    res.status(201).json({
      message: "Survey questions added successfully",
      count: savedSurveyQuestions.length,
      questions: savedSurveyQuestions,
    });
  } catch (error) {
    console.error("Error adding survey questions:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


exports.getSurveyQuestions = async (req, res) => {
  const { surveyquizId } = req.params;

  try {
    const surveyQuiz = await SurveyQuiz.findById(surveyquizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    const surveyQuestions = await SurveyQuestion.find({
      surveyQuiz: surveyquizId,
    });

    if (surveyQuestions.length === 0) {
      return res
        .status(404)
        .json({ message: "No survey questions found for this quiz" });
    }

    const responseQuestions = await Promise.all(
      surveyQuestions.map(async (question) => {
        let fullImageUrl = null;

        if (question.imageUrl) {
          const image = await Media.findById(question.imageUrl);
          if (image) {
            const filename = image.path.split(/[\/\\]/).pop();
            fullImageUrl = getFileUrl(filename);
          }
        }

        return {
          ...question.toObject(),
          imageUrl: fullImageUrl || question.imageUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Survey questions retrieved successfully",
      data: responseQuestions,
    });
  } catch (error) {
    console.error("Error retrieving survey questions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getSurveyQuestionById = async (req, res) => {
  const { surveyquizId, surveyquestionId } = req.params;

  try {
    const surveyQuestion = await SurveyQuestion.findOne({
      _id: surveyquestionId,
      surveyQuiz: surveyquizId,
    });

    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    let fullImageUrl = null;

    if (surveyQuestion.imageUrl) {
      const image = await Media.findById(surveyQuestion.imageUrl);
      if (image) {
        const filename = image.path.split(/[\/\\]/).pop();
        fullImageUrl = getFileUrl(filename);
      }
    }

    const responseQuestion = {
      ...surveyQuestion.toObject(),
      imageUrl: fullImageUrl || surveyQuestion.imageUrl,
    };

    res.status(200).json({
      success: true,
      message: "Survey question retrieved successfully",
      data: responseQuestion,
    });
  } catch (error) {
    console.error("Error retrieving survey question:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updateSurveyQuestionById = async (req, res) => {
  const { surveyquizId, surveyquestionId } = req.params;
  const {
    title,
    description,
    dimension,
    year,
    imageUrl,
    timer,
    answerOptions,
  } = req.body;

  try {
    const surveyQuestion = await SurveyQuestion.findOne({
      _id: surveyquestionId,
      surveyQuiz: surveyquizId,
    });

    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    if (title) surveyQuestion.title = title;
    if (description) surveyQuestion.description = description;
    if (dimension) surveyQuestion.dimension = dimension;
    if (year) surveyQuestion.year = year;
    if (timer) surveyQuestion.timer = timer;
    if (answerOptions) surveyQuestion.answerOptions = answerOptions;

    if (imageUrl === null) {
      surveyQuestion.imageUrl = null;
    } else if (imageUrl) {
      if (imageUrl.includes("/")) {
        const filename = decodeURIComponent(imageUrl.split("/").pop());
        const media = await Media.findOne({
          path: { $regex: new RegExp(filename + "$") },
        });

        if (!media) {
          return res
            .status(404)
            .json({ message: "Image not found in media library" });
        }
        surveyQuestion.imageUrl = media._id;
      } else if (mongoose.Types.ObjectId.isValid(imageUrl)) {
        const media = await Media.findById(imageUrl);
        if (!media) {
          return res.status(404).json({ message: "Image not found" });
        }
        surveyQuestion.imageUrl = imageUrl;
      } else {
        return res
          .status(400)
          .json({ message: "Invalid image URL or ID format" });
      }
    }

    await surveyQuestion.save();

    let fullImageUrl = null;
    if (surveyQuestion.imageUrl) {
      const media = await Media.findById(surveyQuestion.imageUrl);
      if (media) {
        const filename = media.path.split(/[\/\\]/).pop();
        fullImageUrl = getFileUrl(filename);
      }
    }

    const responseQuestion = {
      ...surveyQuestion.toObject(),
      imageUrl: fullImageUrl,
    };

    res.status(200).json({
      success: true,
      message: "Survey question updated successfully",
      data: responseQuestion,
    });
  } catch (error) {
    console.error("Error updating survey question:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteSurveyQuestionById = async (req, res) => {
  const { surveyquizId, surveyquestionId } = req.params;

  try {
    const surveyQuestion = await SurveyQuestion.findOne({
      _id: surveyquestionId,
      surveyQuiz: surveyquizId,
    });

    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    await SurveyQuestion.deleteOne({ _id: surveyquestionId });

    res.status(200).json({
      success: true,
      message: "Survey question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting survey question:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

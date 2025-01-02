const SurveyQuestion = require("../models/surveyQuestion");
const Media = require("../models/Media");
const SurveyQuiz = require("../models/surveyQuiz");
const mongoose = require("mongoose");
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

  // Validate required fields
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
    // Validate if the survey quiz exists
    const surveyQuiz = await SurveyQuiz.findById(surveyquizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    // If imageUrl is provided, fetch the image and construct the full URL
    if (imageUrl) {
      const image = await Media.findById(imageUrl);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Base URL for constructing the full image path
      const baseUrl =
        process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

      // Construct the full image URL
      const encodedImagePath = encodeURIComponent(image.path.split("\\").pop());
      fullImageUrl = `${baseUrl}${encodedImagePath}`;
    }

    // Format answer options (extracting text if needed)
    const formattedAnswerOptions = answerOptions.map((option) => ({
      optionText: option.optionText,
    }));

    // Create a new survey question
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

    // Save the new question to the database
    const savedQuestion = await newSurveyQuestion.save();

    // Add the question to the survey quiz
    surveyQuiz.questions.push(savedQuestion._id);
    await surveyQuiz.save();

    // Include the full image URL in the response
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

// Controller to get all questions for a specific survey quiz
exports.getSurveyQuestions = async (req, res) => {
  const { surveyquizId } = req.params;

  try {
    // Find the survey quiz by ID
    const surveyQuiz = await SurveyQuiz.findById(surveyquizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    // Retrieve all survey questions associated with this quiz
    const surveyQuestions = await SurveyQuestion.find({
      surveyQuiz: surveyquizId,
    });

    // If no questions are found
    if (surveyQuestions.length === 0) {
      return res
        .status(404)
        .json({ message: "No survey questions found for this quiz" });
    }

    // Base URL for constructing the full image path
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    // Loop through all survey questions and include the full image URL if an image exists
    const responseQuestions = await Promise.all(
      surveyQuestions.map(async (question) => {
        let fullImageUrl = null;

        if (question.imageUrl) {
          // Fetch the image document by ID (using Media model)
          const image = await Media.findById(question.imageUrl);
          if (image) {
            // Construct the full image URL
            const encodedImagePath = encodeURIComponent(
              image.path.split("\\").pop()
            );
            fullImageUrl = `${baseUrl}${encodedImagePath}`;
          }
        }

        // Return the survey question with the full image URL
        return {
          ...question.toObject(),
          imageUrl: fullImageUrl || question.imageUrl, // Use full URL or the image ID if not found
        };
      })
    );

    // Return the survey questions with full image URLs
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

// Controller to get a specific question by surveyQuestionId
exports.getSurveyQuestionById = async (req, res) => {
  const { surveyquizId, surveyquestionId } = req.params;

  try {
    // Find the survey question by ID and ensure it's associated with the given survey quiz ID
    const surveyQuestion = await SurveyQuestion.findOne({
      _id: surveyquestionId,
      surveyQuiz: surveyquizId,
    });

    // If the survey question is not found
    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    // Base URL for constructing the full image path
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    let fullImageUrl = null;

    // If the question has an image URL, fetch the image details from Media model
    if (surveyQuestion.imageUrl) {
      const image = await Media.findById(surveyQuestion.imageUrl);
      if (image) {
        // Construct the full image URL
        const encodedImagePath = encodeURIComponent(
          image.path.split("\\").pop()
        );
        fullImageUrl = `${baseUrl}${encodedImagePath}`;
      }
    }

    // Return the survey question with the full image URL (if available)
    const responseQuestion = {
      ...surveyQuestion.toObject(),
      imageUrl: fullImageUrl || surveyQuestion.imageUrl, // Replace with full URL if available
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

// Controller to update a survey question by its surveyQuestionId
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

    // Update basic fields if provided
    if (title) surveyQuestion.title = title;
    if (description) surveyQuestion.description = description;
    if (dimension) surveyQuestion.dimension = dimension;
    if (year) surveyQuestion.year = year;
    if (timer) surveyQuestion.timer = timer;
    if (answerOptions) surveyQuestion.answerOptions = answerOptions;

    // Handle imageUrl - explicitly check if it's null or a value
    if (imageUrl === null) {
      // Remove image association
      surveyQuestion.imageUrl = null;
    } else if (imageUrl) {
      // Existing image URL handling
      if (imageUrl.startsWith("http")) {
        const filename = decodeURIComponent(imageUrl.split("/").pop());
        const media = await Media.findOne({ filename: filename });

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

    // Prepare response with full URL if image exists
    let fullImageUrl = null;
    if (surveyQuestion.imageUrl) {
      const media = await Media.findById(surveyQuestion.imageUrl);
      if (media) {
        const baseUrl =
          process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;
        const encodedImagePath = encodeURIComponent(
          media.path.split("\\").pop()
        );
        fullImageUrl = `${baseUrl}${encodedImagePath}`;
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

// Controller to delete a survey question by its surveyQuestionId
exports.deleteSurveyQuestionById = async (req, res) => {
  const { surveyquizId, surveyquestionId } = req.params;

  try {
    // Find the survey question by ID and ensure it's associated with the provided surveyquizId
    const surveyQuestion = await SurveyQuestion.findOne({
      _id: surveyquestionId,
      surveyQuiz: surveyquizId,
    });

    // If the survey question is not found
    if (!surveyQuestion) {
      return res.status(404).json({ message: "Survey question not found" });
    }

    // Delete the survey question using deleteOne method
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

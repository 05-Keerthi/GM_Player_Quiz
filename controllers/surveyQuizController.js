const Category = require("../models/category");
const SurveyQuestion = require("../models/surveyQuestion");
const SurveyQuiz = require("../models/surveyQuiz");
const SurveySlide = require("../models/surveySlide");
const Media = require("../models/Media");

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

    // Type validation
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

    // Validate categories
    const categoryIds = await Category.find({ _id: { $in: categoryId } });
    if (categoryIds.length !== categoryId.length) {
      return res.status(400).json({ message: "Some categories are invalid." });
    }

    // Validate slides
    const slideIds = await SurveySlide.find({ _id: { $in: slides || [] } });
    if (slides && slideIds.length !== slides.length) {
      return res.status(400).json({ message: "Some slides are invalid." });
    }

    // Validate questions
    const questionIds = await SurveyQuestion.find({
      _id: { $in: questions || [] },
    });
    if (questions && questionIds.length !== questions.length) {
      return res.status(400).json({ message: "Some questions are invalid." });
    }

    // Build the order array
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

    // Create the SurveyQuiz document with the type field
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

    // Save to database
    await surveyQuiz.save();

    // Fetch the saved surveyQuiz with populated fields
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

// Get all SurveyQuizzes
exports.getAllSurveyQuizzes = async (req, res) => {
  try {
    // Fetch all survey quizzes and populate related fields
    const surveyQuizzes = await SurveyQuiz.find()
      .populate("categories")
      .populate("slides")
      .populate("questions");

    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    // Process each survey quiz to handle full image URLs for slides and questions
    const surveyQuizzesWithImageUrls = await Promise.all(
      surveyQuizzes.map(async (surveyQuiz) => {
        // Process slides
        const slidesWithImageUrls = await Promise.all(
          surveyQuiz.slides.map(async (slide) => {
            let fullImageUrl = null;
            if (slide.imageUrl) {
              const media = await Media.findById(slide.imageUrl); // Find media by its ObjectId
              if (media && media.path) {
                // Construct full URL, encoding spaces and normalizing slashes
                const encodedPath = media.path
                  .replace(/ /g, "%20")
                  .replace(/\\/g, "/");
                fullImageUrl = `${baseUrl}${encodedPath.split("/").pop()}`;
              }
            }
            return {
              ...slide.toObject(),
              imageUrl: fullImageUrl, // Replace ObjectId with full URL
            };
          })
        );

        // Process questions
        const questionsWithImageUrls = await Promise.all(
          surveyQuiz.questions.map(async (question) => {
            let fullImageUrl = null;
            if (question.imageUrl) {
              const media = await Media.findById(question.imageUrl); // Find media by its ObjectId
              if (media && media.path) {
                // Construct full URL, encoding spaces and normalizing slashes
                const encodedPath = media.path
                  .replace(/ /g, "%20")
                  .replace(/\\/g, "/");
                fullImageUrl = `${baseUrl}${encodedPath.split("/").pop()}`;
              }
            }
            return {
              ...question.toObject(),
              imageUrl: fullImageUrl, // Replace ObjectId with full URL
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

    // Find the survey quiz by ID and populate related fields
    const surveyQuiz = await SurveyQuiz.findById(id)
      .populate("categories")
      .populate("slides")
      .populate("questions");

    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    // Process slides to handle full image URLs
    const slidesWithImageUrls = await Promise.all(
      surveyQuiz.slides.map(async (slide) => {
        let fullImageUrl = null;
        if (slide.imageUrl) {
          const media = await Media.findById(slide.imageUrl); // Find media by its ObjectId
          if (media && media.path) {
            // Construct full URL, encoding spaces and normalizing slashes
            const encodedPath = media.path
              .replace(/ /g, "%20")
              .replace(/\\/g, "/");
            fullImageUrl = `${baseUrl}${encodedPath.split("/").pop()}`;
          }
        }
        return {
          ...slide.toObject(),
          imageUrl: fullImageUrl, // Replace ObjectId with full URL
        };
      })
    );

    // Process questions to handle full image URLs
    const questionsWithImageUrls = await Promise.all(
      surveyQuiz.questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl);
          if (media && media.path) {
            const encodedPath = media.path
              .replace(/ /g, "%20")
              .replace(/\\/g, "/");
            fullImageUrl = `${baseUrl}${encodedPath.split("/").pop()}`;
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

    // Fetch the survey quiz by ID
    const surveyQuiz = await SurveyQuiz.findById(id);

    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    // Validate provided questions
    if (questions && questions.length > 0) {
      const questionRecords = await SurveyQuestion.find({
        _id: { $in: questions },
      });
      if (questionRecords.length !== questions.length) {
        return res
          .status(400)
          .json({ message: "Some question IDs are invalid" });
      }
      surveyQuiz.questions = questions; // Update the questions
    }

    // Validate provided slides
    if (slides && slides.length > 0) {
      const slideRecords = await SurveySlide.find({ _id: { $in: slides } });
      if (slideRecords.length !== slides.length) {
        return res.status(400).json({ message: "Some slide IDs are invalid" });
      }
      surveyQuiz.slides = slides; // Update the slides
    }

    // Update other fields
    if (title) surveyQuiz.title = title;
    if (description) surveyQuiz.description = description;
    if (isPublic !== undefined) surveyQuiz.isPublic = isPublic;
    if (status) surveyQuiz.status = status;
    if (order) surveyQuiz.order = order; // Update the order

    // Save the updated survey quiz
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

    // Fetch the survey quiz by ID
    const surveyQuiz = await SurveyQuiz.findById(id);

    if (!surveyQuiz) {
      return res.status(404).json({ message: "SurveyQuiz not found" });
    }

    // Delete the survey quiz
    await SurveyQuiz.deleteOne({ _id: id });

    res.status(200).json({ message: "SurveyQuiz deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Publish a survey quiz (admin only)
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

    res
      .status(200)
      .json({ message: "Survey quiz published successfully", surveyQuiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Close a survey quiz (admin only)
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

    res
      .status(200)
      .json({ message: "Survey quiz closed successfully", surveyQuiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const SurveySlide = require("../models/surveySlide"); 
const SurveyQuiz = require("../models/surveyQuiz"); 
const Media = require("../models/Media"); 

// Add a new survey slide
exports.addSurveySlide = async (req, res) => {
  try {
    const { surveyQuizId } = req.params;
    const { surveyTitle, surveyContent, imageUrl, position } = req.body;

    // Check if the survey quiz exists
    const surveyQuiz = await SurveyQuiz.findById(surveyQuizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey Quiz not found" });
    }

    // // Validate the type
    // const validTypes = ["classic", "big_title", "bullet_points"];
    // if (!validTypes.includes(surveyType)) {
    //   return res
    //     .status(400)
    //     .json({ message: `Invalid type. Valid types are: ${validTypes.join(", ")}` });
    // }

    let fullImageUrl = null;

    if (imageUrl) {
      const image = await Media.findById(imageUrl);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;
      fullImageUrl = `${baseUrl}${encodeURIComponent(image.path.split("\\").pop())}`;
    }

    // Create the survey slide
    const newSurveySlide = new SurveySlide({
      surveyQuiz: surveyQuizId,
      surveyTitle,
      surveyContent,
      imageUrl: imageUrl || null,
      position,
    });

    await newSurveySlide.save();

    // Add the slide ID to the survey quiz's slides array
    surveyQuiz.slides.push(newSurveySlide._id);
    await surveyQuiz.save();

    // Prepare the response slide object
    const responseSlide = {
      ...newSurveySlide.toObject(),
      imageUrl: fullImageUrl,
    };

    return res.status(201).json({
      message: "Survey Slide added successfully",
      slide: responseSlide,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all slides for a specific survey quiz
exports.getSurveySlides = async (req, res) => {
  try {
    const { surveyQuizId } = req.params;

    const surveyQuiz = await SurveyQuiz.findById(surveyQuizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey Quiz not found" });
    }

    const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;

    const slides = await SurveySlide.find({ surveyQuiz: surveyQuizId })
      .sort({ position: 1 })
      .populate("imageUrl", "path");

    if (slides.length === 0) {
      return res.status(404).json({ message: "No slides found for this survey quiz" });
    }

    const slidesWithFullImageUrl = slides.map((slide) => {
      const slideObj = slide.toObject();
      if (slideObj.imageUrl && slideObj.imageUrl.path) {
        slideObj.imageUrl = `${baseUrl}${encodeURIComponent(
          slideObj.imageUrl.path.split("\\").pop()
        )}`;
      }
      return slideObj;
    });

    res.status(200).json(slidesWithFullImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific survey slide
exports.getSurveySlide = async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;

    const slide = await SurveySlide.findById(id).populate("imageUrl", "path");
    if (!slide) {
      return res.status(404).json({ message: "Survey Slide not found" });
    }

    const slideObj = slide.toObject();
    if (slideObj.imageUrl && slideObj.imageUrl.path) {
      slideObj.imageUrl = `${baseUrl}${encodeURIComponent(
        slideObj.imageUrl.path.split("\\").pop()
      )}`;
    }

    return res.status(200).json({
      message: "Survey Slide retrieved successfully",
      slide: slideObj,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a survey slide
exports.updateSurveySlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { surveyTitle, surveyContent, imageUrl, position } = req.body;

    const slide = await SurveySlide.findById(id).populate("imageUrl", "path");
    if (!slide) {
      return res.status(404).json({ message: "Survey Slide not found" });
    }

    const baseUrl = process.env.HOST || `${req.protocol}://${req.get('host')}/uploads/`;
    let fullImageUrl = null;

    if (imageUrl) {
      const image = await Media.findById(imageUrl);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      slide.imageUrl = image._id;
      fullImageUrl = `${baseUrl}${encodeURIComponent(
        image.path.split("\\").pop()
      )}`;
    } else if (slide.imageUrl && slide.imageUrl.path) {
      fullImageUrl = `${baseUrl}${encodeURIComponent(
        slide.imageUrl.path.split("\\").pop()
      )}`;
    }


    if (surveyTitle) slide.surveyTitle = surveyTitle;
    if (surveyContent) slide.surveyContent = surveyContent;
    // if (surveyType) slide.surveyType = surveyType;
    if (position) slide.position = position;

    await slide.save();

    const updatedFields = {
      surveyTitle: slide.surveyTitle,
      surveyContent: slide.surveyContent,
      imageUrl: fullImageUrl,
      position: slide.position,
      surveyQuizId: slide.surveyQuiz ? slide.surveyQuiz._id : null,
    };

    return res.status(200).json({
      message: "Survey Slide updated successfully",
      updatedFields,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a survey slide
exports.deleteSurveySlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await SurveySlide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Survey Slide not found" });
    }

    await SurveySlide.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Survey Slide deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


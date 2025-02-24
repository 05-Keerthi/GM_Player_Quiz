const SurveySlide = require("../models/surveySlide");
const SurveyQuiz = require("../models/surveyQuiz");
const Media = require("../models/Media");
const mongoose = require("mongoose");
const { getFileUrl } = require("../utils/urlHelper");

exports.addSurveySlide = async (req, res) => {
  try {
    const { surveyQuizId } = req.params;
    const { surveyTitle, surveyContent, imageUrl, position } = req.body;

    const surveyQuiz = await SurveyQuiz.findById(surveyQuizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey Quiz not found" });
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

    const newSurveySlide = new SurveySlide({
      surveyQuiz: surveyQuizId,
      surveyTitle,
      surveyContent,
      imageUrl: imageUrl || null,
      position,
    });

    await newSurveySlide.save();
    surveyQuiz.slides.push(newSurveySlide._id);
    await surveyQuiz.save();

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
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.addMultipleSurveySlides = async (req, res) => {
  const { surveyQuizId } = req.params;
  const { slides } = req.body;

  try {
    // Validate survey quiz exists
    const surveyQuiz = await SurveyQuiz.findById(surveyQuizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;
    const savedSurveySlides = [];

    // Process each survey slide
    for (const slideData of slides) {
      const { surveyTitle, surveyContent, imageUrl, position } = slideData;

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

      const newSurveySlide = new SurveySlide({
        surveyQuiz: surveyQuizId,
        surveyTitle,
        surveyContent,
        imageUrl: mediaId,
        position: position || 0, // Default position if not provided
      });

      await newSurveySlide.save();
      surveyQuiz.slides.push(newSurveySlide._id);

      savedSurveySlides.push({
        ...newSurveySlide.toObject(),
        imageUrl: fullImageUrl,
      });
    }

    await surveyQuiz.save();

    res.status(201).json({
      message: "Survey slides added successfully",
      count: savedSurveySlides.length,
      slides: savedSurveySlides,
    });
  } catch (error) {
    console.error("Error adding survey slides:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getSurveySlides = async (req, res) => {
  try {
    const { surveyQuizId } = req.params;

    const surveyQuiz = await SurveyQuiz.findById(surveyQuizId);
    if (!surveyQuiz) {
      return res.status(404).json({ message: "Survey Quiz not found" });
    }

    const slides = await SurveySlide.find({ surveyQuiz: surveyQuizId })
      .sort({ position: 1 })
      .populate("imageUrl", "path");

    if (slides.length === 0) {
      return res
        .status(404)
        .json({ message: "No slides found for this survey quiz" });
    }

    const slidesWithFullImageUrl = slides.map((slide) => {
      const slideObj = slide.toObject();
      if (slideObj.imageUrl && slideObj.imageUrl.path) {
        const filename = slideObj.imageUrl.path.split(/[\/\\]/).pop();
        slideObj.imageUrl = getFileUrl(filename);
      }
      return slideObj;
    });

    res.status(200).json(slidesWithFullImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSurveySlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await SurveySlide.findById(id).populate("imageUrl", "path");
    if (!slide) {
      return res.status(404).json({ message: "Survey Slide not found" });
    }

    const slideObj = slide.toObject();
    if (slideObj.imageUrl && slideObj.imageUrl.path) {
      const filename = slideObj.imageUrl.path.split(/[\/\\]/).pop();
      slideObj.imageUrl = getFileUrl(filename);
    }

    return res.status(200).json({
      message: "Survey Slide retrieved successfully",
      slide: slideObj,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.updateSurveySlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { surveyTitle, surveyContent, imageUrl, position } = req.body;

    const slide = await SurveySlide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Survey Slide not found" });
    }

    // Handle imageUrl - explicitly check if it's null or a value
    if (imageUrl === null) {
      slide.imageUrl = null;
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
        slide.imageUrl = media._id;
      } else if (mongoose.Types.ObjectId.isValid(imageUrl)) {
        const media = await Media.findById(imageUrl);
        if (!media) {
          return res.status(404).json({ message: "Image not found" });
        }
        slide.imageUrl = imageUrl;
      } else {
        return res
          .status(400)
          .json({ message: "Invalid image URL or ID format" });
      }
    }

    // Update other fields
    if (surveyTitle) slide.surveyTitle = surveyTitle;
    if (surveyContent) slide.surveyContent = surveyContent;
    if (position) slide.position = position;

    await slide.save();

    let fullImageUrl = null;
    if (slide.imageUrl) {
      const media = await Media.findById(slide.imageUrl);
      if (media) {
        const filename = media.path.split(/[\/\\]/).pop();
        fullImageUrl = getFileUrl(filename);
      }
    }

    const responseSlide = {
      ...slide.toObject(),
      imageUrl: fullImageUrl,
    };

    return res.status(200).json({
      message: "Survey Slide updated successfully",
      data: responseSlide,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

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
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const Slide = require("../models/slide");
const Quiz = require("../models/quiz");
const Media = require("../models/Media");
const { getFileUrl } = require("../utils/urlHelper");

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

exports.addMultipleSlides = async (req, res) => {
  const { quizId } = req.params;
  const { slides } = req.body;

  try {
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Validate slides array
    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of slides",
      });
    }

    const savedSlides = [];

    // Process each slide
    for (const slideData of slides) {
      const { title, content, type, imageUrl } = slideData;

      let fullImageUrl = null;
      let mediaId = null;

      if (imageUrl) {
        const image = await Media.findById(imageUrl);
        if (image) {
          mediaId = image._id;
          const encodedImagePath = encodeURIComponent(
            image.path.split("\\").pop()
          );
          fullImageUrl = `${process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`}${encodedImagePath}`;
        }
      }

      const newSlide = new Slide({
        quiz: quizId,
        title,
        content,
        type,
        imageUrl: mediaId,
      });

      await newSlide.save();
      quiz.slides.push(newSlide._id);

      savedSlides.push({
        ...newSlide.toObject(),
        imageUrl: fullImageUrl,
      });
    }

    await quiz.save();

    res.status(201).json({
      message: "Slides added successfully",
      count: savedSlides.length,
      slides: savedSlides,
    });
  } catch (error) {
    console.error("Error adding slides:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.addSlide = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, content, type, imageUrl, position } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const validTypes = ["classic", "big_title", "bullet_points"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Valid types are: ${validTypes.join(", ")}`,
      });
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

    const newSlide = new Slide({
      quiz: quizId,
      title,
      content,
      type,
      imageUrl: imageUrl || null,
      position,
    });

    await newSlide.save();
    quiz.slides.push(newSlide._id);
    await quiz.save();

    const responseSlide = {
      ...newSlide.toObject(),
      imageUrl: fullImageUrl,
    };

    res.status(201).json(responseSlide);
  } catch (error) {
    console.error("Error in addSlide:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSlides = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const slides = await Slide.find({ quiz: quizId })
      .sort({ position: 1 })
      .populate("imageUrl", "path");

    if (slides.length === 0) {
      return res.status(404).json({ message: "No slides found for this quiz" });
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

exports.getSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await Slide.findById(id).populate("imageUrl", "path");

    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    const slideObj = slide.toObject();
    if (slideObj.imageUrl && slideObj.imageUrl.path) {
      const filename = slideObj.imageUrl.path.split(/[\/\\]/).pop();
      slideObj.imageUrl = getFileUrl(filename);
    }

    return res.status(200).json({
      message: "Slide retrieved successfully",
      slide: slideObj,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, imageUrl, position } = req.body;

    const slide = await Slide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    let mediaId = null;
    if (imageUrl !== null && imageUrl !== undefined) {
      mediaId = await getMediaIdFromPath(imageUrl);
    }

    slide.title = title || slide.title;
    slide.content = content || slide.content;
    slide.type = type || slide.type;
    slide.imageUrl = imageUrl === null ? null : mediaId || slide.imageUrl;
    if (position !== undefined) slide.position = position;

    await slide.save();

    let fullImageUrl = null;
    if (slide.imageUrl) {
      const media = await Media.findById(slide.imageUrl);
      if (media) {
        const filename = media.path.split(/[\/\\]/).pop();
        fullImageUrl = getFileUrl(filename);
      }
    }

    res.status(200).json({
      message: "Slide updated successfully",
      slide: {
        ...slide.toObject(),
        imageUrl: imageUrl === null ? null : fullImageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await Slide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    await Slide.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Slide deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

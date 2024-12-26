const Slide = require("../models/slide"); // Slide model
const Quiz = require("../models/quiz"); // Quiz model
const Media = require("../models/Media");

// add slide
// In slideController.js, update the addSlide function to match question pattern:

exports.addSlide = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, content, type, imageUrl, position } = req.body;

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    let fullImageUrl = null;

    if (imageUrl) {
      // Fetch the image document by ID (using Media model)
      const image = await Media.findById(imageUrl); // Use the media ID directly
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Base URL for constructing the full image path
      const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

      // Construct the full image URL and encode it
      const encodedImagePath = encodeURIComponent(image.path.split('\\').pop());
      fullImageUrl = `${baseUrl}${encodedImagePath}`;
    }

    // Create new slide
    const newSlide = new Slide({
      quiz: quizId,
      title,
      content,
      type,
      imageUrl: imageUrl ? imageUrl : null, // Store the media ID directly
      position: position || 0
    });

    await newSlide.save();

    // Add the slide ID to the quiz's slides array
    quiz.slides.push(newSlide._id);
    await quiz.save();

    // Prepare the response slide object
    const responseSlide = {
      ...newSlide.toObject(),
      imageUrl: fullImageUrl // Use the full URL in the response
    };

    res.status(201).json(responseSlide);
  } catch (error) {
    console.error('Error in addSlide:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get details of all specific slide

exports.getSlides = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Base URL for constructing the full image path
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    // Find slides related to the quiz and populate the imageUrl field
    const slides = await Slide.find({ quiz: quizId })
      .sort({ position: 1 })
      .populate("imageUrl"); // Populate the full image document

    if (slides.length === 0) {
      return res.status(404).json({ message: "No slides found for this quiz" });
    }

    // Map through slides and append the full image URL
    const slidesWithFullImageUrl = slides.map((slide) => {
      const slideObj = slide.toObject();
      if (slideObj.imageUrl && slideObj.imageUrl.path) {
        const encodedImagePath = encodeURIComponent(
          slideObj.imageUrl.path.split("\\").pop()
        );
        slideObj.imageUrl = `${baseUrl}${encodedImagePath}`;
      }
      return slideObj;
    });

    res.status(200).json(slidesWithFullImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get details of a specific slide
exports.getSlide = async (req, res) => {
  try {
    const { id } = req.params;

    // Base URL for constructing the full image path
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    const slide = await Slide.findById(id).populate("imageUrl", "path"); // Populate the imageUrl field to fetch the path

    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    // Construct the full image URL if imageUrl exists, with encoding
    const slideObj = slide.toObject();
    if (slideObj.imageUrl && slideObj.imageUrl.path) {
      slideObj.imageUrl = `${baseUrl}${encodeURIComponent(
        slideObj.imageUrl.path.split("\\").pop()
      )}`;
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

// Update a slide (admin only)

const getMediaIdFromPath = async (imageUrl) => {
  try {
    if (!imageUrl) return null;

    // If it's already an ObjectId, return it
    if (typeof imageUrl === "string" && !imageUrl.includes("/")) {
      return imageUrl;
    }

    // Extract the path from the URL
    const pathMatch = imageUrl.match(/\/uploads\/(.*)/);
    if (!pathMatch) return null;

    const imagePath = "uploads/" + pathMatch[1];

    // Find the media document by path
    const media = await Media.findOne({ path: imagePath });
    return media ? media._id : null;
  } catch (error) {
    console.error("Error getting media ID:", error);
    return null;
  }
};

exports.updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, imageUrl, position } = req.body;

    // Fetch the slide to update
    const slide = await Slide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    let fullImageUrl = null;
    let imageId = null;

    if (imageUrl) {
      // If imageUrl is already a Media ID
      const image = await Media.findById(imageUrl);
      if (image) {
        // Base URL for constructing the full image path
        const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;
        const encodedImagePath = encodeURIComponent(
          image.path.split("\\").pop()
        );
        fullImageUrl = `${baseUrl}${encodedImagePath}`;
        imageId = image._id;
      }
    }

    // Update slide fields
    if (title) slide.title = title;
    if (content) slide.content = content;
    if (type) slide.type = type;
    if (position) slide.position = position;
    if (imageUrl !== undefined) {
      slide.imageUrl = imageId; // Store the ID in the database
    }

    await slide.save();

    // Return the response with the full URL
    return res.status(200).json({
      message: "Slide updated successfully",
      slide: {
        ...slide.toObject(),
        imageUrl: fullImageUrl, // Send the full URL in the response
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a slide (admin only)
exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await Slide.findById(id);
    if (!slide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    // Correct way to delete the slide
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

const Question = require('../models/question');
const Quiz = require('../models/quiz');
const Media = require('../models/Media');

exports.addQuestion = async (req, res) => {
  const { quizId } = req.params;
  const { title, type, imageUrl, options, correctAnswer, points, timer } = req.body;

  try {
    // Validate if the quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let fullImageUrl = null;

    if (imageUrl) {
      // Fetch the image document by ID (using Media model)
      const image = await Media.findById(imageUrl); // Make sure imageUrl is the media _id
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Base URL for constructing the full image path
      const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

      // Construct the full image URL (from the Media path) and encode it for spaces
      const encodedImagePath = encodeURIComponent(image.path.split('\\').pop());
      fullImageUrl = `${baseUrl}${encodedImagePath}`;
    }

    // Create a new question
    const newQuestion = new Question({
      quiz: quizId,
      title,
      type,
      imageUrl: imageUrl ? imageUrl : null, // Save the image ID if provided, otherwise null
      options,
      correctAnswer,
      points,
      timer
    });

    await newQuestion.save();

    quiz.questions.push(newQuestion._id);
    await quiz.save();

    // Include the full image URL in the response if available
    const responseQuestion = {
      ...newQuestion.toObject(),
      imageUrl: fullImageUrl // Replace image ID with the full URL in the response if it exists
    };

    res.status(201).json(responseQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getQuestions = async (req, res) => {
  const { quizId } = req.params;

  try {
    // Base URL for constructing the full image path
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Find questions related to the quiz and populate the imageUrl field
    const questions = await Question.find({ quiz: quizId })
      .populate('imageUrl', 'path'); // Populating imageUrl to fetch the path field

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    // Map through questions and append the full image URL
    const questionsWithFullImageUrl = questions.map(question => {
      const questionObj = question.toObject();
      if (questionObj.imageUrl && questionObj.imageUrl.path) {
        // Encode the image URL to handle spaces and special characters
        const encodedImagePath = encodeURIComponent(questionObj.imageUrl.path.split('\\').pop());
        questionObj.imageUrl = `${baseUrl}${encodedImagePath}`;
      }
      return questionObj;
    });

    res.status(200).json(questionsWithFullImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getQuestionById = async (req, res) => {
  const { id } = req.params;

  try {
    // Base URL for constructing the full image path
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Find the question by ID and populate the imageUrl field
    const question = await Question.findById(id).populate('imageUrl', 'path'); // Populate imageUrl with the path field

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Convert the question object to plain JSON and append the full image URL
    const questionObj = question.toObject();
    if (questionObj.imageUrl && questionObj.imageUrl.path) {
      // Encode the image path to handle spaces and special characters
      const encodedImagePath = encodeURIComponent(questionObj.imageUrl.path.split('\\').pop());
      questionObj.imageUrl = `${baseUrl}${encodedImagePath}`;
    }

    res.status(200).json(questionObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { title, type, imageUrl, options, correctAnswer, points, timer } = req.body;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update fields
    question.title = title || question.title;
    question.type = type || question.type;
    question.imageUrl = imageUrl || question.imageUrl; // Should be an ObjectId
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;
    question.points = points || question.points;
    question.timer = timer || question.timer;

    await question.save();

    // Populate `imageUrl` to include Media details
    const updatedQuestion = await Question.findById(id).populate("imageUrl");

    // Base URL for constructing the full image path
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    // Construct full URL if `imageUrl` exists
    let fullImageUrl = null;
    if (updatedQuestion.imageUrl && updatedQuestion.imageUrl.path) {
      const encodedImagePath = encodeURIComponent(updatedQuestion.imageUrl.path.split("\\").pop());
      fullImageUrl = `${baseUrl}${encodedImagePath}`;
    }

    res.status(200).json({
      message: "Question updated successfully",
      updatedFields: {
        ...(title && { title }),
        ...(type && { type }),
        ...(imageUrl && { imageUrl: fullImageUrl }),
        ...(options && { options }),
        ...(correctAnswer && { correctAnswer }),
        ...(points && { points }),
        ...(timer && { timer }),
      },
      question: {
        ...updatedQuestion.toObject(),
        imageUrl: fullImageUrl, // Return the full URL in the response
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Delete the question
    await Question.deleteOne({ _id: id });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

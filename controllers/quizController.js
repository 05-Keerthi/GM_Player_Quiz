const Quiz = require('../models/quiz');
const Category = require('../models/category');
const Slide = require('../models/slide');
const Question = require('../models/question');
const User = require('../models/User');
const Media = require('../models/Media');

// Create a new quiz (admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, categoryId, slides, questions, tenantId, duration } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    // Validate categories, slides, and questions are valid ObjectIds
    const categoryIds = await Category.find({ '_id': { $in: categoryId } });
    const slideIds = await Slide.find({ '_id': { $in: slides } });
    const questionIds = await Question.find({ '_id': { $in: questions } });

    const quiz = new Quiz({
      title,
      description,
      categories: categoryId,
      slides,
      questions,
      tenantId,
      createdBy: req.user._id,
      status: 'draft', // Default status as draft
      duration,
    });

    await quiz.save();
    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    // Fetch all quizzes and populate related fields
    const quizzes = await Quiz.find()
      .populate('categories')
      .populate('slides')
      .populate('questions');

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Process each quiz to handle full image URLs for slides and questions
    const quizzesWithImageUrls = await Promise.all(
      quizzes.map(async (quiz) => {
        // Process slides
        const slidesWithImageUrls = await Promise.all(
          quiz.slides.map(async (slide) => {
            let fullImageUrl = null;
            if (slide.imageUrl) {
              const media = await Media.findById(slide.imageUrl); // Find media by its ObjectId
              if (media && media.path) {
                // Construct full URL, encoding spaces and normalizing slashes
                const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
                fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
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
          quiz.questions.map(async (question) => {
            let fullImageUrl = null;
            if (question.imageUrl) {
              const media = await Media.findById(question.imageUrl); // Find media by its ObjectId
              if (media && media.path) {
                // Construct full URL, encoding spaces and normalizing slashes
                const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
                fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
              }
            }
            return {
              ...question.toObject(),
              imageUrl: fullImageUrl, // Replace ObjectId with full URL
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get details of a specific quiz
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('categories')
      .populate('slides')
      .populate('questions');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Process the slides to include full image URLs
    const slidesWithImageUrls = await Promise.all(
      quiz.slides.map(async (slide) => {
        let fullImageUrl = null;
        if (slide.imageUrl) {
          const media = await Media.findById(slide.imageUrl); // Find the media by its ObjectId
          if (media && media.path) {
            // Construct the full image URL
            const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
            fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
          }
        }
        return {
          ...slide.toObject(),
          imageUrl: fullImageUrl, // Replace ObjectId with full URL
        };
      })
    );

    // Process the questions to include full image URLs
    const questionsWithImageUrls = await Promise.all(
      quiz.questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl); // Find the media by its ObjectId
          if (media && media.path) {
            // Construct the full image URL
            const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
            fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
          }
        }
        return {
          ...question.toObject(),
          imageUrl: fullImageUrl, // Replace ObjectId with full URL
        };
      })
    );

    // Return the quiz with the processed slides and questions
    res.status(200).json({
      ...quiz.toObject(),
      slides: slidesWithImageUrls,
      questions: questionsWithImageUrls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Update a quiz (admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// exports.updateQuiz = async (req, res) => {
//   try {
//     // Update the quiz
//     const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true })
//       .populate('categories')
//       .populate('slides')
//       .populate('questions');

//     if (!quiz) {
//       return res.status(404).json({ message: 'Quiz not found' });
//     }

//     const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

//     // Process the slides to include full image URLs
//     const slidesWithImageUrls = await Promise.all(
//       quiz.slides.map(async (slide) => {
//         let fullImageUrl = null;
//         if (slide.imageUrl) {
//           const media = await Media.findById(slide.imageUrl); // Find the media by its ObjectId
//           if (media && media.path) {
//             // Construct the full image URL
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
//           }
//         }
//         return {
//           ...slide.toObject(),
//           imageUrl: fullImageUrl, // Replace ObjectId with full URL
//         };
//       })
//     );

//     // Process the questions to include full image URLs
//     const questionsWithImageUrls = await Promise.all(
//       quiz.questions.map(async (question) => {
//         let fullImageUrl = null;
//         if (question.imageUrl) {
//           const media = await Media.findById(question.imageUrl); // Find the media by its ObjectId
//           if (media && media.path) {
//             // Construct the full image URL
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
//           }
//         }
//         return {
//           ...question.toObject(),
//           imageUrl: fullImageUrl, // Replace ObjectId with full URL
//         };
//       })
//     );

//     // Return the updated quiz with the full image URLs for slides and questions
//     res.status(200).json({
//       message: 'Quiz updated successfully',
//       quiz: {
//         ...quiz.toObject(),
//         slides: slidesWithImageUrls,
//         questions: questionsWithImageUrls,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// Delete a quiz (admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Publish a quiz (admin only)
exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ message: 'Quiz published successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close a quiz (admin only)
exports.closeQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ message: 'Quiz closed successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

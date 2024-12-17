const Category = require('../models/category'); 
const SurveyQuestion = require('../models/surveyQuestion'); 
const SurveyQuiz = require('../models/surveyQuiz'); 
const Media = require('../models/Media');

const ActivityLog = require('../models/ActivityLog'); 

// Create a new SurveyQuiz
exports.createSurveyQuiz = async (req, res) => {
  try {
    const { title, description, categoryId, questions, isPublic } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

        // Validate categories, slides, and questions are valid ObjectIds
    const categoryIds = await Category.find({ '_id': { $in: categoryId } });
    const questionIds = await SurveyQuestion.find({ '_id': { $in: questions } });

    // Create the SurveyQuiz document
    const surveyQuiz = new SurveyQuiz({
      title,
      description,
      categories: categoryId,
      questions,
      createdBy: req.user._id, // Assuming you have a user in the request
      status: 'draft', // Default status as draft
      isPublic,
    });

    // Save to database
    await surveyQuiz.save();

    const activityLog = new ActivityLog({
      user: req.user._id,
      activityType: 'survey_create',
      details: {
        username: req.user.username,
        surveyTitle: title,
        surveyDescription: description,
        tenantId: req.user.tenantId || 'defaultTenantId', 
        duration: req.body.duration || 'N/A',           
      },
      createdAt: new Date(),
    });
    
    await activityLog.save();

        // Fetch the saved surveyQuiz with populated fields
    const populatedSurveyQuiz = await SurveyQuiz.findById(surveyQuiz._id)
      .populate('categories') 
      .populate('questions'); 

    res.status(201).json({ message: 'SurveyQuiz created successfully', surveyQuiz: populatedSurveyQuiz  });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all SurveyQuizzes
exports.getAllSurveyQuizzes = async (req, res) => {
  try {
    // Fetch all survey quizzes and populate related fields
    const surveyQuizzes = await SurveyQuiz.find()
      .populate('categories')
      .populate('questions');

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Process each survey quiz to handle full image URLs for categories and questions
    const surveysWithImageUrls = await Promise.all(
      surveyQuizzes.map(async (survey) => {

        // Process questions
        const questionsWithImageUrls = await Promise.all(
          survey.questions.map(async (question) => {
            let fullImageUrl = null;
            if (question.imageUrl) {
              const media = await Media.findById(question.imageUrl); // Find media by its ObjectId
              if (media && media.path) {
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
          ...survey.toObject(),
          questions: questionsWithImageUrls,
        };
      })
    );

    res.status(200).json(surveysWithImageUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSurveyQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the survey quiz by ID and populate related fields
    const surveyQuiz = await SurveyQuiz.findById(id)
      .populate('categories')
      .populate('questions');

    if (!surveyQuiz) {
      return res.status(404).json({ message: 'SurveyQuiz not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

    // Process questions to handle full image URLs
    const questionsWithImageUrls = await Promise.all(
      surveyQuiz.questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl);
          if (media && media.path) {
            const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
            fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
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
      questions: questionsWithImageUrls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSurveyQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, isPublic, status } = req.body;

    // Fetch the survey quiz by ID
    const surveyQuiz = await SurveyQuiz.findById(id);

    if (!surveyQuiz) {
      return res.status(404).json({ message: 'SurveyQuiz not found' });
    }


    // Validate provided questions
    if (questions && questions.length > 0) {
      const questionRecords = await SurveyQuestion.find({ '_id': { $in: questions } });
      if (questionRecords.length !== questions.length) {
        return res.status(400).json({ message: 'Some question IDs are invalid' });
      }
      surveyQuiz.questions = questions; // Update the questions
    }

    // Update other fields
    if (title) surveyQuiz.title = title;
    if (description) surveyQuiz.description = description;
    if (isPublic !== undefined) surveyQuiz.isPublic = isPublic;
    if (status) surveyQuiz.status = status;

    // Save the updated survey quiz
    const updatedSurveyQuiz = await surveyQuiz.save();

    res.status(200).json({
      message: 'SurveyQuiz updated successfully',
      surveyQuiz: updatedSurveyQuiz,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteSurveyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the survey quiz by ID
    const surveyQuiz = await SurveyQuiz.findById(id);

    if (!surveyQuiz) {
      return res.status(404).json({ message: 'SurveyQuiz not found' });
    }

    // Delete the survey quiz
    await SurveyQuiz.deleteOne({ _id: id });

    res.status(200).json({ message: 'SurveyQuiz deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Publish a survey quiz (admin only)
exports.publishSurveyQuiz = async (req, res) => {
  try {
    const surveyQuiz = await SurveyQuiz.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!surveyQuiz) {
      return res.status(404).json({ message: 'Survey quiz not found' });
    }

    res.status(200).json({ message: 'Survey quiz published successfully', surveyQuiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close a survey quiz (admin only)
exports.closeSurveyQuiz = async (req, res) => {
  try {
    const surveyQuiz = await SurveyQuiz.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );

    if (!surveyQuiz) {
      return res.status(404).json({ message: 'Survey quiz not found' });
    }

    res.status(200).json({ message: 'Survey quiz closed successfully', surveyQuiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const Category = require('../models/category');
const Quiz = require('../models/quiz');

// Create a new category (admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check for duplicate name
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name must be unique' });
    }

    const category = new Category({
      name,
      description,
    });

    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific category's details
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a category (admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (name) {
      // Check for duplicate name
      const existingCategory = await Category.findOne({ name });
      if (existingCategory && existingCategory._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Category name must be unique' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Ensure validation runs on update
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.errors });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getQuizCountForCategory = async (req, res) => {
  try {
    const { categoryId } = req.params; // Get the category ID from the request params

    // Check if category ID is a valid ObjectId
    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Find the category by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get the quizzes associated with this category
    const quizzes = await Quiz.find({ categories: categoryId });

    // Get the count of quizzes
    const quizCount = quizzes.length;

    // Return the response with category details, quiz count, and quizzes
    res.status(200).json({
      message: `Quiz count for category ID ${categoryId}`,
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
      },
      quizCount: quizCount,
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

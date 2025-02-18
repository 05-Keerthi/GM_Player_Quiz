const { Agent } = require("praisonai");
const Category = require("../models/category");

const COLOR_PALETTE = [
  "#FF5733",
  "#58D68D",
  "#3498DB",
  "#F4D03F",
  "#E74C3C",
  "#2ECC71",
  "#9B59B6",
  "#F39C12",
  "#1ABC9C",
  "#34495E",
];

const topicAgent = new Agent({
  instructions: `
    You suggest topics based on recent events and specified categories.
    When categories are provided, ensure topics are strictly relevant to those categories.
    When no categories are specified, suggest diverse topics from various fields.
    Keep topics engaging and suitable for quiz creation.
    Return pure JSON.
  `,
  name: "TopicSuggester",
  role: "Topic Suggestion Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false,
});

const questionAgent = new Agent({
  instructions: `
    You generate questions with colored options and provide related slides for the topic.
    Each option must have a unique color from the provided palette.
    For multiple choice and multiple select questions, use 4 different colors.
    For true/false questions, use 2 different colors.
    For poll questions, use up to 5 different colors.
    For open-ended questions, no colors needed.
    
    Additionally, generate slide content summarizing key points about the topic.
    
    Return JSON in this format:
    {
      "topic": "string",
      "questions": [
        {
          "question": "string",
          "type": "multiple_choice|true_false|multiple_select|poll|open_ended",
          "options": [
            {
              "text": "string",
              "isCorrect": boolean,
              "color": "Choose from: ${COLOR_PALETTE.join(", ")}"
            }
          ],
          "correctAnswer": "string (only for open_ended type)"
        }
      ],
      "slides": [
        {
          "title": "string",
          "content": "string",
          "type": "classic|big_title|bullet_points"
        }
      ]
    }

    **Slide Types:**
    - 'classic': A standard slide with a title and descriptive content.
    - 'big_title': A slide with a focus on a bold, attention-grabbing title.
    - 'bullet_points': A slide that lists key points as bullet points under the title.

    **Rules:**
    1. Each option in a question must have a different color.
    2. Use colors from the provided palette only.
    3. For multiple_choice and multiple_select: use 4 different colors.
    4. For true_false: use 2 different colors.
    5. For poll: use one color per option (2-5 colors).
    6. For open_ended: no colors needed.
    7. Every question type must have at least 1 correct answer.
    8. Multiple choice and true/false must have exactly 1 correct answer.
    9. Multiple select can have multiple correct answers but minimum 1.
  `,
  name: "QuestionSlideGenerator",
  role: "Question & Slide Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false,
});

const cleanResponse = (response) => {
  if (typeof response === "string") {
    return JSON.parse(response.replace(/```json\n|\n```/g, ""));
  }
  return response;
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getTopics = async (req, res) => {
  try {
    const { categoryIds = [] } = req.body;

    // Populate category data from database
    const categories = await Category.find({
      _id: { $in: categoryIds },
    }).select("name");

    // Extract category names for the prompt
    const categoryNames = categories.map((cat) => cat.name);

    let prompt = `Return 5 topic suggestions as JSON:`;

    if (categoryNames.length > 0) {
      prompt += `
      Focus on generating topics specifically related to these categories: ${categoryNames.join(
        ", "
      )}
      `;
    }

    prompt += `
      {
        "topics": [
          {
            "title": "string"
          }
        ]
      }
    `;

    const response = await topicAgent.start(prompt);
    const topics = cleanResponse(response);
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// In generateQuestions function, modify the validation and prompt:
const generateQuestions = async (req, res) => {
  try {
    const { topic, numQuestions = 5, numSlides = 5 } = req.body;

    if (!topic?.title) {
      return res.status(400).json({
        error: "Topic title is required",
      });
    }

    // Updated prompt to include slide types
    const response = await questionAgent.start(`
      Generate ${numQuestions} questions and ${numSlides} slides for: ${topic.title}
      
      **Question Types:**
      - multiple_choice: exactly 4 options, exactly 1 correct answer
      - multiple_select: 4-6 options, at least 1 correct answer but can have multiple
      - true_false: exactly 2 options, exactly 1 must be correct
      - poll: 2-5 options, at least 1 option must be marked as correct
      - open_ended: no options, must include correct answer
      
      **Slide Generation:**
      - Each slide should represent a key point or summary related to the topic.
      - Slide types should be one of the following: "classic", "big_title", or "bullet_points".
      - "classic": A general slide type with title and content.
      - "big_title": A slide with a large, bold title and minimal content.
      - "bullet_points": A slide with a title and key points in bullet format.
      - Keep the slide content engaging and concise.
      - Return slides as an array of objects with "title", "content", and "type".

      **Return JSON:**
      {
        "topic": "${topic.title}",
        "questions": [
          {
            "question": "string",
            "type": "multiple_choice|true_false|multiple_select|poll|open_ended",
            "options": [
              {
                "text": "string",
                "isCorrect": boolean,
                "color": "Choose color from: ${COLOR_PALETTE.join(", ")}"
              }
            ],
            "correctAnswer": "string (only for open_ended type)"
          }
        ],
        "slides": [
          {
            "title": "string",
            "content": "string",
            "type": "classic|big_title|bullet_points"
          }
        ]
      }

      **Rules:**
      1. Each option in a question must have a different color.
      2. Use colors from the provided palette only.
      3. For multiple_choice and multiple_select: use 4 different colors.
      4. For true_false: use 2 different colors.
      5. For poll: use one color per option (2-5 colors).
      6. For open_ended: no colors needed.
      7. Every question type must have at least 1 correct answer.
      8. Multiple choice and true/false must have exactly 1 correct answer.
      9. Multiple select can have multiple correct answers but minimum 1.
    `);

    let data = cleanResponse(response);

    // Validate and enforce correct answer requirements
    data.questions = data.questions.map((question) => {
      if (question.type === "open_ended") {
        return {
          ...question,
          options: [],
        };
      }

      // Count correct answers
      const correctAnswers = question.options.filter(
        (opt) => opt.isCorrect
      ).length;

      // Validate based on question type
      switch (question.type) {
        case "multiple_choice":
        case "true_false":
          if (correctAnswers !== 1) {
            // Fix by making first option correct and others incorrect
            question.options = question.options.map((opt, idx) => ({
              ...opt,
              isCorrect: idx === 0,
            }));
          }
          break;

        case "multiple_select":
        case "poll":
          if (correctAnswers === 0) {
            // Make first option correct if no correct answers
            question.options[0].isCorrect = true;
          }
          break;
      }

      return question;
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getTopics,
  generateQuestions,
};

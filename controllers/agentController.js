const { Agent } = require("praisonai");

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
  instructions: "You suggest topics based on recent events. Return pure JSON.",
  name: "TopicSuggester",
  role: "Topic Suggestion Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false,
});

const questionAgent = new Agent({
  instructions: `
    You generate questions with colored options. 
    Each option must have a unique color from the provided palette.
    For multiple choice and multiple select questions, use 4 different colors.
    For true/false questions, use 2 different colors.
    For poll questions, use up to 5 different colors.
    For open-ended questions, no colors needed.
    Return pure JSON.
  `,
  name: "QuestionGenerator",
  role: "Question Generation Assistant",
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
    const response = await topicAgent.start(`
      Return 5 topic suggestions as JSON:
      {
        "topics": [
          {
            "title": "string",
            "description": "string"
          }
        ]
      }
    `);

    const topics = cleanResponse(response);
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateQuestions = async (req, res) => {
  try {
    const { topic, numQuestions = 5 } = req.body;

    if (!topic?.title || !topic?.description) {
      return res.status(400).json({
        error: "Topic title and description required",
      });
    }

    const response = await questionAgent.start(`
      Generate ${numQuestions} questions for: ${topic.title}
      Context: ${topic.description}
      
      Mix different question types:
      - multiple_choice: exactly 4 options
      - multiple_select: 4-6 options, multiple correct answers
      - true_false: exactly 2 options
      - poll: 2-5 options, no correct answer
      - open_ended: no options, include correct answer
      
      Return JSON:
      {
        "topic": "${topic.title}",
        "questions": [
          {
            "question": "string",
            "type": "multiple_choice|true_false|multiple_select|poll|open_ended",
            "options": [
              {
                "text": "string",
                "isCorrect": boolean (except for poll type),
                "color": "Choose a unique color from: ${COLOR_PALETTE.join(
                  ", "
                )}"
              }
            ],
            "correctAnswer": "string (only for open_ended type)"
          }
        ]
      }

      Rules for colors:
      1. Each option in a question must have a different color
      2. Use colors from the provided palette only
      3. For multiple_choice and multiple_select: use 4 different colors
      4. For true_false: use 2 different colors
      5. For poll: use one color per option (2-5 colors)
      6. For open_ended: no colors needed
    `);

    let questions = cleanResponse(response);

    // Process questions based on their type
    questions.questions = questions.questions.map((question) => {
      if (question.type === "open_ended") {
        return {
          ...question,
          options: [], // No options for open-ended questions
        };
      }

      const shuffledColors = shuffleArray([...COLOR_PALETTE]);

      // Determine number of options based on question type
      const numOptions =
        {
          multiple_choice: 4,
          true_false: 2,
          multiple_select: question.options.length || 4,
          poll: question.options.length || 3,
        }[question.type] || 4;

      question.options = question.options
        .slice(0, numOptions)
        .map((option, index) => ({
          ...option,
          color: shuffledColors[index],
          isCorrect: question.type === "poll" ? undefined : option.isCorrect,
        }));

      return question;
    });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTopics,
  generateQuestions,
};

const { Agent } = require("praisonai");

// Initialize agents
const topicAgent = new Agent({
  instructions: "You suggest topics based on recent events. Return pure JSON.",
  name: "TopicSuggester",
  role: "Topic Suggestion Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false
});

const questionAgent = new Agent({
  instructions: "You generate questions with colored options. Return pure JSON.",
  name: "QuestionGenerator",
  role: "Question Generation Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false
});

// Helper function to clean JSON response
const cleanResponse = (response) => {
  if (typeof response === "string") {
    return JSON.parse(response.replace(/```json\n|\n```/g, ""));
  }
  return response;
};

// Get topic suggestions
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

// Generate questions
const generateQuestions = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic?.title || !topic?.description) {
      return res.status(400).json({ 
        error: "Topic title and description required" 
      });
    }

    const response = await questionAgent.start(`
      Generate questions for: ${topic.title}
      Context: ${topic.description}
      
      Return JSON:
      {
        "topic": "${topic.title}",
        "questions": [
          {
            "question": "string",
            "type": "multiple_choice|true_false",
            "options": [
              {
                "text": "string",
                "isCorrect": boolean,
                "color": "#HEXCODE"
              }
            ]
          }
        ]
      }
    `);

    const questions = cleanResponse(response);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTopics,
  generateQuestions
};
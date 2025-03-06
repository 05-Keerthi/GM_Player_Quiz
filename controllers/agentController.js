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
    You MUST generate EXACTLY the number of questions and slides specified in each request.
    If asked for 10 questions, generate EXACTLY 10 questions - no more, no less.
    If asked for 20 slides, generate EXACTLY 20 slides - no more, no less.
    
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

const surveyAgent = new Agent({
  instructions: `
    You are a Survey Creation Assistant. Your task is to generate engaging survey questions with answer options.
    You MUST generate EXACTLY the number of questions and slides specified in each request.
    If asked for 10 questions, generate EXACTLY 10 questions - no more, no less.
    If asked for 5 slides, generate EXACTLY 5 slides - no more, no less.
    
    Each question type should be multiple choice, rating scale, or open-ended.
    Include slides with context or informational content for the survey.

    **Answer Option Rules:**
    - Each option should have a unique, randomly generated color.
    - Open-ended questions do not need answer options or colors.

    **Return JSON Format:**
    {
      "surveyTitle": "string",
      "surveyContent": "string",
      "questions": [
        {
          "title": "string",
          "description": "string",
          "dimension": integer (1-5),
          "year": 2024,
          "timer": integer (in seconds),
          "answerOptions": [
            {
              "optionText": "string",
              "color": "Randomly generated HEX color code"
            }
          ]
        }
      ],
      "slides": [
        {
          "slideTitle": "string",
          "slideContent": "string"
        }
      ]
    }

    **Rules:**
    1. At least one slide must be included before or between questions.
    2. Questions should be clear and concise.
    3. Use customer experience as the theme.
    4. Ensure colors are randomly generated.
  `,
  name: "SurveyGenerator",
  role: "Survey Creation Assistant",
  llm: "gemini-2.0-flash-exp",
  markdown: false,
});

const cleanResponse = (response) => {
  if (typeof response === "string") {
    return JSON.parse(response.replace(/```json\n|\n```/g, ""));
  }
  return response;
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

const generateQuestions = async (req, res) => {
  try {
    const { topic, numQuestions, numSlides } = req.body;

    if (!topic?.title) {
      return res.status(400).json({
        error: "Topic title is required",
      });
    }

    // Ensure numQuestions and numSlides are numbers
    const requestedQuestions = parseInt(numQuestions) || 5;
    const requestedSlides = parseInt(numSlides) || 0;

    // Updated prompt to include slide types and more emphatic instructions
    const response = await questionAgent.start(`
      You MUST generate EXACTLY ${requestedQuestions} questions and EXACTLY ${requestedSlides} slides for: ${
      topic.title
    }
      
      The number of questions (${requestedQuestions}) and slides (${requestedSlides}) is a strict requirement.
      
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
            "type": "classic|big_title|bullet_points"
            "content": "string",
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

    // Check if we received the correct number of questions
    if (data.questions.length !== requestedQuestions) {
      console.warn(
        `Expected ${requestedQuestions} questions but got ${data.questions.length}`
      );

      // Adjust the questions array to match requested amount
      if (data.questions.length > requestedQuestions) {
        // Truncate extra questions
        data.questions = data.questions.slice(0, requestedQuestions);
      } else {
        // Add dummy questions if needed (this shouldn't happen often with improved prompt)
        const questionTypes = [
          "multiple_choice",
          "true_false",
          "multiple_select",
          "poll",
          "open_ended",
        ];
        while (data.questions.length < requestedQuestions) {
          const questionType =
            questionTypes[Math.floor(Math.random() * questionTypes.length)];

          // Create a placeholder question
          const newQuestion = {
            question: `Additional question about ${topic.title} (${
              data.questions.length + 1
            })`,
            type: questionType,
            options: [],
          };

          // Add appropriate options based on question type
          if (questionType === "multiple_choice") {
            newQuestion.options = [
              { text: "Option 1", isCorrect: true, color: COLOR_PALETTE[0] },
              { text: "Option 2", isCorrect: false, color: COLOR_PALETTE[1] },
              { text: "Option 3", isCorrect: false, color: COLOR_PALETTE[2] },
              { text: "Option 4", isCorrect: false, color: COLOR_PALETTE[3] },
            ];
          } else if (questionType === "true_false") {
            newQuestion.options = [
              { text: "True", isCorrect: true, color: COLOR_PALETTE[0] },
              { text: "False", isCorrect: false, color: COLOR_PALETTE[1] },
            ];
          } else if (questionType === "multiple_select") {
            newQuestion.options = [
              { text: "Option 1", isCorrect: true, color: COLOR_PALETTE[0] },
              { text: "Option 2", isCorrect: true, color: COLOR_PALETTE[1] },
              { text: "Option 3", isCorrect: false, color: COLOR_PALETTE[2] },
              { text: "Option 4", isCorrect: false, color: COLOR_PALETTE[3] },
            ];
          } else if (questionType === "poll") {
            newQuestion.options = [
              { text: "Option 1", isCorrect: true, color: COLOR_PALETTE[0] },
              { text: "Option 2", isCorrect: false, color: COLOR_PALETTE[1] },
              { text: "Option 3", isCorrect: false, color: COLOR_PALETTE[2] },
            ];
          } else if (questionType === "open_ended") {
            newQuestion.correctAnswer = `Sample answer about ${topic.title}`;
          }

          data.questions.push(newQuestion);
        }
      }
    }

    // Check if we received the correct number of slides (if any were requested)
    if (requestedSlides > 0 && data.slides.length !== requestedSlides) {
      console.warn(
        `Expected ${requestedSlides} slides but got ${data.slides.length}`
      );

      // Adjust the slides array to match requested amount
      if (data.slides.length > requestedSlides) {
        // Truncate extra slides
        data.slides = data.slides.slice(0, requestedSlides);
      } else {
        // Add dummy slides if needed
        const slideTypes = ["classic", "big_title", "bullet_points"];
        while (data.slides.length < requestedSlides) {
          const slideType =
            slideTypes[Math.floor(Math.random() * slideTypes.length)];

          // Create a placeholder slide
          const newSlide = {
            title: `Additional Information about ${topic.title} (${
              data.slides.length + 1
            })`,
            type: slideType,
            content:
              slideType === "bullet_points"
                ? `• Key point 1 about ${topic.title}\n• Key point 2 about ${topic.title}\n• Key point 3 about ${topic.title}`
                : `This slide provides additional information about ${topic.title}.`,
          };

          data.slides.push(newSlide);
        }
      }
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateSurveyQuestions = async (req, res) => {
  try {
    const { topic, numSurveyQuestions, numSurveySlides } = req.body;

    if (!topic?.title) {
      return res.status(400).json({ error: "Survey topic title is required" });
    }

    // Ensure numSurveyQuestions and numSurveySlides are numbers
    const requestedQuestions = parseInt(numSurveyQuestions) || 5;
    const requestedSlides = parseInt(numSurveySlides) || 0;

    const response = await surveyAgent.start(`
      You MUST generate EXACTLY ${requestedQuestions} survey questions and EXACTLY ${requestedSlides} survey slides for the topic: "${
      topic.title
    }"
      
      The number of questions (${requestedQuestions}) and slides (${requestedSlides}) is a strict requirement and must be followed precisely.
      
      **Survey Question Format:**
      - Must be well-structured, unbiased, and clear.
      - Should focus on opinions, experiences, or feedback.
      - Each question must have 4-5 answer options with different colors.
      - Return JSON format with properties:
      
      {
        "questions": [
          {
            "title": "string (Question text)",
            "description": "string (Brief explanation, if needed)",
            "dimension": number (1-5, indicating complexity level),
            "year": 2024,
            "timer": number (default 30 seconds),
            "answerOptions": [
              {
                "optionText": "string (Answer option)",
                "color": "Auto-select from: ${COLOR_PALETTE.join(", ")}"
              }
            ]
          }
        ]
      }

      **Survey Slide Format:**
      - Must provide context, key insights, or relevant information.
      - Should be engaging and informative.
      - Return JSON format with properties:

      {
        "slides": [
          {
            "surveyTitle": "string (Slide title)",
            "surveyContent": "string (Descriptive content for the slide)"
          }
        ]
      }

      **Rules:**
      1. Answer options must have unique colors.
      2. Colors should be selected dynamically from the provided palette.
      3. Questions should focus on engagement and opinion gathering.
      4. Ensure a good mix of questions and slides in the output.

      **Final Output Format (JSON):**
      {
        "topic": "${topic.title}",
        "questions": [...],
        "slides": [...]
      }
    `);

    let surveyData = cleanResponse(response);

    // Check if we received the correct number of questions
    if (surveyData.questions.length !== requestedQuestions) {
      console.warn(
        `Expected ${requestedQuestions} survey questions but got ${surveyData.questions.length}`
      );

      // Adjust the questions array to match requested amount
      if (surveyData.questions.length > requestedQuestions) {
        // Truncate extra questions
        surveyData.questions = surveyData.questions.slice(
          0,
          requestedQuestions
        );
      } else {
        // Add dummy questions if needed
        while (surveyData.questions.length < requestedQuestions) {
          // Create a placeholder question
          const newQuestion = {
            title: `Survey Question ${surveyData.questions.length + 1} about ${
              topic.title
            }`,
            description: `Please share your thoughts about ${topic.title}`,
            dimension: Math.floor(Math.random() * 5) + 1,
            year: 2024,
            timer: 30,
            answerOptions: [
              { optionText: "Strongly agree", color: COLOR_PALETTE[0] },
              { optionText: "Agree", color: COLOR_PALETTE[1] },
              { optionText: "Neutral", color: COLOR_PALETTE[2] },
              { optionText: "Disagree", color: COLOR_PALETTE[3] },
              { optionText: "Strongly disagree", color: COLOR_PALETTE[4] },
            ],
          };

          surveyData.questions.push(newQuestion);
        }
      }
    }

    // Check if we received the correct number of slides (if any were requested)
    if (
      requestedSlides > 0 &&
      (!surveyData.slides || surveyData.slides.length !== requestedSlides)
    ) {
      // Initialize slides array if it doesn't exist
      if (!surveyData.slides) {
        surveyData.slides = [];
      }

      console.warn(
        `Expected ${requestedSlides} survey slides but got ${surveyData.slides.length}`
      );

      // Adjust the slides array to match requested amount
      if (surveyData.slides.length > requestedSlides) {
        // Truncate extra slides
        surveyData.slides = surveyData.slides.slice(0, requestedSlides);
      } else {
        // Add dummy slides if needed
        while (surveyData.slides.length < requestedSlides) {
          // Create a placeholder slide
          const newSlide = {
            surveyTitle: `Information Slide ${
              surveyData.slides.length + 1
            } about ${topic.title}`,
            surveyContent: `This slide provides information about ${topic.title} to help you respond to the survey questions.`,
          };

          surveyData.slides.push(newSlide);
        }
      }
    }

    res.status(200).json(surveyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateArtPulseSurvey = async (req, res) => {
  try {
    const { topic, numSurveyQuestions, numSurveySlides } = req.body;

    if (!topic?.title) {
      return res.status(400).json({ error: "Survey topic title is required" });
    }

    // Ensure numSurveyQuestions and numSurveySlides are numbers
    const requestedQuestions = parseInt(numSurveyQuestions) || 5;
    const requestedSlides = parseInt(numSurveySlides) || 0;

    const response = await surveyAgent.start(`
      You MUST generate EXACTLY ${requestedQuestions} survey questions and EXACTLY ${requestedSlides} slides related to the topic: "${
      topic.title
    }" about art and creativity.
      
      The number of questions (${requestedQuestions}) and slides (${requestedSlides}) is a strict requirement and must be followed precisely.
      
      **Focus Areas:**
      - Art styles (e.g., abstract, realism, digital art)
      - Art appreciation and engagement
      - Artistic experiences and feedback

      **Survey Question Instructions:**
      - Each question should be clear, opinion-based, and focused on art.
      - Use answer options like "Very Interested", "Somewhat Interested", etc., with unique colors for each option.
      - Each answer option must have 4-5 unique colors.

      **Survey Slide Instructions:**
      - Provide art-related insights or context.
      - The content should be engaging, fun, or educational.
      
      **Output JSON Format:**
      {
        "topic": "${topic.title}",
        "questions": [
          {
            "title": "string (Question text)",
            "description": "string (Brief explanation, if needed)",
            "dimension": number (1-5, indicating complexity level),
            "year": 2024,
            "timer": number (default 30 seconds),
            "answerOptions": [
              {
                "optionText": "string (Answer option)",
                "color": "Auto-select from: ${COLOR_PALETTE.join(", ")}"
              }
            ]
          }
        ],
        "slides": [
          {
            "slideTitle": "string (Slide title)",
            "slideContent": "string (Descriptive content for the slide)"
          }
        ]
      }
    `);

    let surveyData = cleanResponse(response);

    // Check if we received the correct number of questions
    if (surveyData.questions.length !== requestedQuestions) {
      console.warn(
        `Expected ${requestedQuestions} ArtPulse questions but got ${surveyData.questions.length}`
      );

      // Adjust the questions array to match requested amount
      if (surveyData.questions.length > requestedQuestions) {
        // Truncate extra questions
        surveyData.questions = surveyData.questions.slice(
          0,
          requestedQuestions
        );
      } else {
        // Add dummy questions if needed
        while (surveyData.questions.length < requestedQuestions) {
          // Create a placeholder question about art
          const artTopics = [
            "painting styles",
            "art exhibitions",
            "digital art",
            "artistic expression",
            "creative process",
          ];
          const randomTopic =
            artTopics[Math.floor(Math.random() * artTopics.length)];

          const newQuestion = {
            title: `How interested are you in ${randomTopic}?`,
            description: `Please rate your level of interest in ${randomTopic} related to ${topic.title}`,
            dimension: Math.floor(Math.random() * 5) + 1,
            year: 2024,
            timer: 30,
            answerOptions: [
              { optionText: "Very Interested", color: COLOR_PALETTE[0] },
              { optionText: "Somewhat Interested", color: COLOR_PALETTE[1] },
              { optionText: "Neutral", color: COLOR_PALETTE[2] },
              { optionText: "Slightly Interested", color: COLOR_PALETTE[3] },
              { optionText: "Not Interested", color: COLOR_PALETTE[4] },
            ],
          };

          surveyData.questions.push(newQuestion);
        }
      }
    }

    // Check if we received the correct number of slides (if any were requested)
    if (
      requestedSlides > 0 &&
      (!surveyData.slides || surveyData.slides.length !== requestedSlides)
    ) {
      // Initialize slides array if it doesn't exist
      if (!surveyData.slides) {
        surveyData.slides = [];
      }

      console.warn(
        `Expected ${requestedSlides} ArtPulse slides but got ${surveyData.slides.length}`
      );

      // Adjust the slides array to match requested amount
      if (surveyData.slides.length > requestedSlides) {
        // Truncate extra slides
        surveyData.slides = surveyData.slides.slice(0, requestedSlides);
      } else {
        // Add dummy slides if needed
        const artTopics = [
          "Art History",
          "Modern Art Movements",
          "Digital Art Revolution",
          "Creative Techniques",
          "Art Appreciation",
        ];
        while (surveyData.slides.length < requestedSlides) {
          const slideTopic =
            artTopics[surveyData.slides.length % artTopics.length];

          // Create a placeholder slide about art
          const newSlide = {
            slideTitle: `${slideTopic} - Slide ${surveyData.slides.length + 1}`,
            slideContent: `This slide explores ${slideTopic.toLowerCase()} in relation to ${
              topic.title
            }, highlighting key elements and considerations for artistic expression.`,
          };

          surveyData.slides.push(newSlide);
        }
      }
    }

    res.status(200).json(surveyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTopics,
  generateQuestions,
  generateSurveyQuestions,
  generateArtPulseSurvey,
};

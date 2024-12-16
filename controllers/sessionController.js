// const Session = require('../models/session');
// const Quiz = require('../models/quiz');
// const Question = require('../models/question');
// const QRCode = require('qrcode');
// const crypto = require('crypto');
// const Media = require('../models/Media');
// const Slide = require('../models/slide'); 

// // create a new session for quiz
// exports.createSession = async (req, res) => {
//   const { quizId } = req.params;
//   const hostId = req.user._id;

//   try {
//     // Generate a random join code
//     const joinCode = crypto.randomInt(100000, 999999).toString();

//     // Create a session document without `qrData` for now
//     const session = new Session({
//       quiz: quizId,
//       host: hostId,
//       joinCode,
//       status: 'waiting',
//     });

//     const savedSession = await session.save();

//     // Now construct qrData using the session ID
//     const qrData = `${req.protocol}://${req.get('host')}/api/sessions/${joinCode}/${savedSession._id}/join`;

//     // Generate QR code as base64
//     const qrCodeImageUrl = await QRCode.toDataURL(qrData);

//     // Update the session with qrData
//     savedSession.qrData = qrData;
//     await savedSession.save();

//     // Emit the socket event
//     const io = req.app.get('socketio'); // Get the Socket.IO instance from the app
//     io.emit('create-session', { sessionId: savedSession._id, joinCode });

//     res.status(201).json({
//       _id: savedSession._id,
//       quiz: savedSession.quiz,
//       host: savedSession.host,
//       joinCode: savedSession.joinCode,
//       qrData: savedSession.qrData,
//       qrCodeImageUrl,
//       status: savedSession.status,
//       players: savedSession.players,
//       createdAt: savedSession.createdAt,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating the session', error });
//   }
// };


// // join a session(user)
// exports.joinSession = async (req, res) => {
//   const { joinCode } = req.params; // Extract joinCode only
//   const userId = req.user._id;

//   try {
//     // Find the session using joinCode
//     const session = await Session.findOne({ joinCode });
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     // Check if the session is open for joining
//     if (session.status !== 'waiting') {
//       return res.status(400).json({ message: 'Session is not open for joining' });
//     }

//     // Check if the user has already joined the session
//     if (session.players.includes(userId)) {
//       return res.status(400).json({ message: 'User has already joined the session' });
//     }

//     // Add the user to the session's players
//     session.players.push(userId);
//     await session.save();

//     // Emit the join event to the session's room
//     const io = req.app.get('socketio');
//     io.to(session._id.toString()).emit('player-joined', { playerId: userId });

//     res.status(200).json({
//       message: 'User successfully joined the session',
//       session,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error joining the session', error });
//   }
// };

// // get the players list for the session
// exports.getSessionPlayers = async (req, res) => {
//   const { joinCode, sessionId } = req.params; // Extract joinCode and sessionId

//   try {
//     // Find the session using both joinCode and sessionId
//     const session = await Session.findOne({ joinCode, _id: sessionId }).populate('players', 'username email'); // Populate player details

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     // Determine the status for each player based on the session's status
//     const status = session.status === 'waiting' ? 'waiting' : 'in_progress';

//     // Attach the status to each player in the response
//     const players = session.players.map(player => ({
//       username: player.username,
//       email: player.email,
//       status,
//     }));

//     // Get the player count
//     const playerCount = players.length;

//     res.status(200).json({
//       players,
//       playerCount, // Include the player count
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching session players', error });
//   }
// };


// // start the session
// exports.startSession = async (req, res) => {
//   const { joinCode, sessionId } = req.params;

//   try {
//     const session = await Session.findOne({ joinCode, _id: sessionId }).populate('quiz');
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     if (session.status !== 'waiting') {
//       return res.status(400).json({ message: 'Session cannot be started' });
//     }

//     // Fetch both questions and slides
//     const questions = await Question.find({ _id: { $in: session.quiz.questions } });
//     const slides = await Slide.find({ _id: { $in: session.quiz.slides } });

//     session.status = 'in_progress';
//     session.questions = questions.map((q) => q._id);
//     session.slides = slides.map((s) => s._id);
//     session.startTime = Date.now();
//     await session.save();

//     // Construct Base URL
//     const baseUrl = `${req.protocol}://${req.get('host')}/`;

//     // Process questions to include full image URLs
//     const questionsWithImageUrls = await Promise.all(
//       questions.map(async (question) => {
//         let fullImageUrl = null;

//         if (question.imageUrl) {
//           const media = await Media.findById(question.imageUrl);
//           if (media && media.path) {
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath}`;
//           }
//         }

//         return {
//           ...question.toObject(),
//           imageUrl: fullImageUrl,
//         };
//       })
//     );

//     // Process slides to include full image URLs
//     const slidesWithImageUrls = await Promise.all(
//       slides.map(async (slide) => {
//         let fullImageUrl = null;

//         if (slide.imageUrl) {
//           const media = await Media.findById(slide.imageUrl);
//           if (media && media.path) {
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath}`;
//           }
//         }

//         return {
//           ...slide.toObject(),
//           imageUrl: fullImageUrl,
//         };
//       })
//     );

//     // Emit the session start event to the room
//     const io = req.app.get('socketio');
//     io.to(session._id.toString()).emit('session-started', { session });

//     res.status(200).json({
//       message: 'Session started successfully',
//       session,
//       questions: questionsWithImageUrls,
//       slides: slidesWithImageUrls, // Add slides to the response
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error starting the session', error });
//   }
// };

// // get the session questions
// // exports.getSessionQuestions = async (req, res) => {
// //   const { joinCode, sessionId } = req.params;

// //   try {
// //     // Find the session and populate both questions and quiz (to get slides)
// //     const session = await Session.findOne({ joinCode, _id: sessionId })
// //       .populate('questions')
// //       .populate('quiz');
      
// //     if (!session) {
// //       return res.status(404).json({ message: 'Session not found' });
// //     }

// //     if (session.status !== 'in_progress') {
// //       return res.status(400).json({ message: 'Session is not in progress' });
// //     }

// //     // Fetch slides using the quiz's slides array
// //     const slides = await Slide.find({ _id: { $in: session.quiz.slides } });

// //     // Construct base URL for media
// //     const baseUrl = `${req.protocol}://${req.get('host')}/`;

// //     // Process questions to add full, encoded image URLs
// //     const questionsWithImageUrls = await Promise.all(
// //       session.questions.map(async (question) => {
// //         let fullImageUrl = null;

// //         if (question.imageUrl) {
// //           const media = await Media.findById(question.imageUrl);
// //           if (media && media.path) {
// //             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
// //             fullImageUrl = `${baseUrl}${encodedPath}`;
// //           }
// //         }

// //         return {
// //           ...question.toObject(),
// //           imageUrl: fullImageUrl,
// //         };
// //       })
// //     );

// //     // Process slides to add full, encoded image URLs
// //     const slidesWithImageUrls = await Promise.all(
// //       slides.map(async (slide) => {
// //         let fullImageUrl = null;

// //         if (slide.imageUrl) {
// //           const media = await Media.findById(slide.imageUrl);
// //           if (media && media.path) {
// //             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
// //             fullImageUrl = `${baseUrl}${encodedPath}`;
// //           }
// //         }

// //         return {
// //           ...slide.toObject(),
// //           imageUrl: fullImageUrl,
// //         };
// //       })
// //     );

// //     res.status(200).json({
// //       questions: questionsWithImageUrls,
// //       slides: slidesWithImageUrls
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Error fetching questions and slides', error });
// //   }
// // };

// exports.getSessionQuestions = async (req, res) => {
//   const { joinCode, sessionId } = req.params;

//   try {
//     // Find the session and populate both questions and quiz (to get slides and order)
//     const session = await Session.findOne({ joinCode, _id: sessionId })
//       .populate('questions')
//       .populate('quiz');
      
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     if (session.status !== 'in_progress') {
//       return res.status(400).json({ message: 'Session is not in progress' });
//     }

//     // Fetch slides using the quiz's slides array
//     const slides = await Slide.find({ _id: { $in: session.quiz.slides } });

//     // Construct base URL for media
//     const baseUrl = `${req.protocol}://${req.get('host')}/`;

//     // Process questions to add full, encoded image URLs
//     const questionsWithImageUrls = await Promise.all(
//       session.questions.map(async (question) => {
//         let fullImageUrl = null;

//         if (question.imageUrl) {
//           const media = await Media.findById(question.imageUrl);
//           if (media && media.path) {
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath}`;
//           }
//         }

//         return {
//           ...question.toObject(),
//           imageUrl: fullImageUrl,
//           type: 'question', // Add type for ordering
//         };
//       })
//     );

//     // Process slides to add full, encoded image URLs
//     const slidesWithImageUrls = await Promise.all(
//       slides.map(async (slide) => {
//         let fullImageUrl = null;

//         if (slide.imageUrl) {
//           const media = await Media.findById(slide.imageUrl);
//           if (media && media.path) {
//             const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//             fullImageUrl = `${baseUrl}${encodedPath}`;
//           }
//         }

//         return {
//           ...slide.toObject(),
//           imageUrl: fullImageUrl,
//           type: 'slide', // Add type for ordering
//         };
//       })
//     );

//     // Combine questions and slides
//     const combinedItems = [...questionsWithImageUrls, ...slidesWithImageUrls];

//     // Sort based on the order in the quiz
//     const orderedItems = session.quiz.order.map((itemId) => {
//       return combinedItems.find((item) => item._id.toString() === itemId);
//     });

//     res.status(200).json({
//       order: session.quiz.order,
//       items: orderedItems,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching questions and slides', error });
//   }
// };



// // Change question by code and session controller
// // exports.changeQuestionByCodeAndSession = async (req, res) => {
// //   const { joinCode, sessionId, questionId } = req.params;
// //   const { title, type, imageUrl } = req.body;

// //   try {
// //     // Find the session by joinCode and sessionId
// //     const session = await Session.findOne({ joinCode, _id: sessionId }).populate('questions');
// //     if (!session) {
// //       return res.status(404).json({ message: 'Session not found' });
// //     }

// //     // Find the question by its ID
// //     const question = session.questions.find(q => q._id.toString() === questionId);
// //     if (!question) {
// //       return res.status(404).json({ message: 'Question not found' });
// //     }

// //     // If an image URL is provided, convert it to the media ObjectId
// //     if (imageUrl) {
// //       const media = await Media.findOne({ path: imageUrl }); // Find the Media document by its path
// //       if (media) {
// //         question.imageUrl = media._id; // Store the ObjectId of the media in the question's imageUrl field
// //       } else {
// //         return res.status(404).json({ message: 'Media not found' });
// //       }
// //     }

// //     // Update any other fields of the question here (e.g., title, type, etc.)
// //     question.title = title || question.title;
// //     question.type = type || question.type;

// //     // Save the updated question
// //     await question.save();

// //     // Construct the full image URL for the updated question if the image exists
// //     let fullImageUrl = null;
// //     if (question.imageUrl) {
// //       const media = await Media.findById(question.imageUrl); // Find the media by its ObjectId
// //       if (media && media.path) {
// //         // Encode spaces and normalize slashes
// //         const baseUrl = `${req.protocol}://${req.get('host')}/`;
// //         const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
// //         fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
// //       }
// //     }

// //     // Update session's currentQuestion field after changing the question
// //    session.currentQuestion = question._id;
// //    await session.save();

// //     // Return the updated question with the full image URL
// //     res.status(200).json({
// //       message: 'Question changed successfully',
// //       question: {
// //         ...question.toObject(),
// //         imageUrl: fullImageUrl, // Return the full URL instead of the ObjectId
// //       },
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Error changing the question', error });
// //   }
// // };

// exports.changeQuestionByCodeAndSession = async (req, res) => {
//   const { joinCode, sessionId, questionId } = req.params;
//   const { title, type, imageUrl, newPosition } = req.body;

//   try {
//     // Find the session by joinCode and sessionId
//     const session = await Session.findOne({ joinCode, _id: sessionId })
//       .populate('questions')
//       .populate('quiz');

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     // Find the question by its ID
//     const question = session.questions.find((q) => q._id.toString() === questionId);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     // If an image URL is provided, convert it to the media ObjectId
//     if (imageUrl) {
//       const media = await Media.findOne({ path: imageUrl }); // Find the Media document by its path
//       if (media) {
//         question.imageUrl = media._id; // Store the ObjectId of the media in the question's imageUrl field
//       } else {
//         return res.status(404).json({ message: 'Media not found' });
//       }
//     }

//     // Update fields of the question
//     question.title = title || question.title;
//     question.type = type || question.type;

//     // Save the updated question
//     await question.save();

//     // Update the session's quiz order if a new position is specified
//     if (newPosition !== undefined && session.quiz && session.quiz.order) {
//       const currentOrder = session.quiz.order;
//       const questionIndex = currentOrder.indexOf(questionId);

//       // Remove the question ID from its current position
//       if (questionIndex > -1) {
//         currentOrder.splice(questionIndex, 1);
//       }

//       // Insert the question ID at the new position
//       currentOrder.splice(newPosition, 0, questionId);

//       // Save the updated order in the quiz
//       session.quiz.order = currentOrder;
//       await session.quiz.save();
//     }

//     // Construct the full image URL for the updated question if the image exists
//     let fullImageUrl = null;
//     if (question.imageUrl) {
//       const media = await Media.findById(question.imageUrl); // Find the media by its ObjectId
//       if (media && media.path) {
//         // Encode spaces and normalize slashes
//         const baseUrl = `${req.protocol}://${req.get('host')}/`;
//         const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//         fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
//       }
//     }

//     // Update session's currentQuestion field after changing the question
//     session.currentQuestion = question._id;
//     await session.save();

//     // Return the updated question with the full image URL
//     res.status(200).json({
//       message: 'Question changed successfully',
//       question: {
//         ...question.toObject(),
//         imageUrl: fullImageUrl, // Return the full URL instead of the ObjectId
//       },
//       updatedOrder: session.quiz.order, // Return the updated order
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error changing the question', error });
//   }
// };


// // get the current question for the user 
// exports.getCurrentQuestionInSession = async (req, res) => {
//   const { joinCode, sessionId } = req.params;

//   try {
//     // Find the session by joinCode and sessionId
//     const session = await Session.findOne({ joinCode, _id: sessionId })
//       .populate('questions') // Populate questions
//       .populate('currentQuestion'); // Populate currentQuestion

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     // Ensure the session is in progress
//     if (session.status !== 'in_progress') {
//       return res.status(400).json({ message: 'Session is not in progress' });
//     }

//     // Check if the session has a current question
//     if (!session.currentQuestion) {
//       return res.status(404).json({ message: 'Current question not found in session' });
//     }

//     const currentQuestion = session.currentQuestion.toObject();

//     // Construct the full image URL if the current question has an imageUrl
//     let fullImageUrl = null;
//     if (currentQuestion.imageUrl) {
//       const media = await Media.findById(currentQuestion.imageUrl); // Find the media by its ObjectId
//       if (media && media.path) {
//         const baseUrl = `${req.protocol}://${req.get('host')}/`;
//         const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/');
//         fullImageUrl = `${baseUrl}${encodedPath.split('/').pop()}`;
//       }
//     }

//     // Return the current question with the full image URL
//     res.status(200).json({
//       currentQuestion: {
//         ...currentQuestion,
//         imageUrl: fullImageUrl, // Return the full URL instead of the ObjectId
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching current question', error });
//   }
// };

// // end the session
// exports.endSession = async (req, res) => {
//   const { joinCode, sessionId } = req.params; // Extract joinCode and sessionId from the URL

//   try {
//     // Find the session using both joinCode and sessionId
//     const session = await Session.findOne({ joinCode, _id: sessionId });
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     session.status = 'completed';
//     session.endTime = Date.now();
//     await session.save();

//   // Emit the session end event to the room
//   const io = req.app.get('socketio');
//   io.to(session._id.toString()).emit('session-ended', { session });

//     res.status(200).json({ message: 'Session ended successfully', session });
//   } catch (error) {
//     res.status(500).json({ message: 'Error ending the session', error });
//   }
// };


const Session = require('../models/session');
const Quiz = require('../models/quiz');
const Question = require('../models/question');
const QRCode = require('qrcode');
const crypto = require('crypto');
const Media = require('../models/Media');
const Slide = require('../models/slide'); 
const User = require("../models/User");
const Report = require('../models/Report');
const Answer = require('../models/answer');
const Leaderboard = require('../models/leaderBoard');

// create a new session for quiz
exports.createSession = async (req, res) => {
  const { quizId } = req.params;
  const hostId = req.user._id;

  try {
    // Generate a random join code
    const joinCode = crypto.randomInt(100000, 999999).toString();

    // Create a session document without `qrData` for now
    const session = new Session({
      quiz: quizId,
      host: hostId,
      joinCode,
      status: 'waiting',
    });

    const savedSession = await session.save();

    // Now construct qrData using the session ID
    const qrData = `${req.protocol}://${req.get('host')}/api/sessions/${joinCode}/${savedSession._id}/join`;

    // Generate QR code as base64
    const qrCodeImageUrl = await QRCode.toDataURL(qrData);

    // Update the session with qrData
    savedSession.qrData = qrData;
    await savedSession.save();

    // Populate the session with player details
    const populatedSession = await Session.findById(savedSession._id)
      .populate("players", "username email")
      .populate("host", "username email")
      .populate("quiz");

    // Emit the socket event
    const io = req.app.get("socketio");
    io.emit("create-session", {
      sessionId: populatedSession._id,
      joinCode: populatedSession.joinCode,
    });

    res.status(201).json({
      _id: populatedSession._id,
      quiz: populatedSession.quiz,
      host: populatedSession.host,
      joinCode: populatedSession.joinCode,
      qrData: populatedSession.qrData,
      qrCodeImageUrl,
      status: populatedSession.status,
      players: populatedSession.players,
      createdAt: populatedSession.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating the session', error });
  }
};


// join a session(user)
exports.joinSession = async (req, res) => {
  const { joinCode } = req.params;
  const userId = req.user._id;

  try {
    // Find the session using joinCode
    let session = await Session.findOne({ joinCode })
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if the session is open for joining
    if (session.status !== "waiting") {
      return res
        .status(400)
        .json({ message: "Session is not open for joining" });
    }

    // Check if the user has already joined the session
    if (
      session.players.some(
        (player) => player._id.toString() === userId.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "User has already joined the session" });
    }

    // Get user details
    const user = await User.findById(userId).select("username email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the user to the session's players
    session.players.push(userId);
    await session.save();

    // Refresh the populated session
    session = await Session.findById(session._id)
      .populate("players", "username email")
      .populate("host", "username email");

    // Emit the join event with full user details
    const io = req.app.get("socketio");
    io.emit("player-joined", { user }); // Emit to all connected clients

    res.status(200).json({
      message: "User successfully joined the session",
      session,
    });
  } catch (error) {
    console.error("Join session error:", error);
    res.status(500).json({ message: "Error joining the session", error });
  }
};
// start the session
exports.startSession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Find and populate the session
    const session = await Session.findOne({
      joinCode,
      _id: sessionId,
    })
      .populate("quiz")
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "waiting") {
      return res.status(400).json({ message: "Session cannot be started" });
    }

    // Fetch both questions and slides
    const questions = await Question.find({ _id: { $in: session.quiz.questions } });
    const slides = await Slide.find({ _id: { $in: session.quiz.slides } });

    session.status = "in_progress";
    session.questions = questions.map((q) => q._id);
    session.slides = slides.map((s) => s._id);
    session.startTime = Date.now();
    await session.save();

    // Construct Base URL
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    // Process questions to include full image URLs and correct answers
    const questionsWithImageUrls = await Promise.all(
      questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl);
          if (media && media.path) {
            const encodedPath = media.path.replace(/ /g, "%20").replace(/\\/g, "/");
            fullImageUrl = `${baseUrl}${encodedPath}`;
          }
        }
        return {
          ...question.toObject(),
          imageUrl: fullImageUrl,
        };
      })
    );

    // Process slides to include full image URLs
    const slidesWithImageUrls = await Promise.all(
      slides.map(async (slide) => {
        let fullImageUrl = null;
        if (slide.imageUrl) {
          const media = await Media.findById(slide.imageUrl);
          if (media && media.path) {
            const encodedPath = media.path.replace(/ /g, "%20").replace(/\\/g, "/");
            fullImageUrl = `${baseUrl}${encodedPath}`;
          }
        }
        return {
          ...slide.toObject(),
          imageUrl: fullImageUrl,
        };
      })
    );

    // Emit the session start event
    const io = req.app.get("socketio");
    io.emit("session-started", {
      session,
      questions: questionsWithImageUrls,
      slides: slidesWithImageUrls,
    });

    res.status(200).json({
      message: "Session started successfully",
      session,
      questions: questionsWithImageUrls,
      slides: slidesWithImageUrls,
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ message: "Error starting the session", error });
  }
};

exports.nextQuestion = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    const session = await Session.findOne({
      joinCode,
      _id: sessionId,
    })
      .populate("quiz")
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    const quiz = await Quiz.findById(session.quiz)
      .populate("questions")
      .populate("slides");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Combine questions and slides
    const contentItems = [
      ...quiz.questions.map((q) => ({ type: "question", item: q })),
      ...quiz.slides.map((s) => ({ type: "slide", item: s })),
    ];

    if (contentItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No content available in the quiz" });
    }

    // Get current index
    const currentIndex = session.currentQuestion
      ? contentItems.findIndex(
          ({ item }) =>
            item._id.toString() === session.currentQuestion.toString()
        )
      : -1;

    // Get next item
    const nextIndex = currentIndex + 1;
    if (nextIndex >= contentItems.length) {
      return res
        .status(400)
        .json({ message: "No more items left in the session" });
    }

    const nextItemData = contentItems[nextIndex];
    const nextItem = nextItemData.item;
    const itemType = nextItemData.type;

    if (!nextItem) {
      return res.status(404).json({ message: "Next item not found" });
    }

    // Update session
    session.currentQuestion = nextItem._id;
    await session.save();

    // Process image URL if exists
    const baseUrl = `${req.protocol}://${req.get("host")}/`;
    let fullImageUrl = null;

    if (nextItem.imageUrl) {
      const media = await Media.findById(nextItem.imageUrl);
      if (media && media.path) {
        const encodedPath = media.path.replace(/ /g, "%20").replace(/\\/g, "/");
        fullImageUrl = `${baseUrl}${encodedPath}`;
      }
    }

    const itemWithImageUrl = {
      ...nextItem.toObject(),
      imageUrl: fullImageUrl,
    };

    // Emit the next item
    const io = req.app.get("socketio");
    io.emit("next-item", {type: itemType,item: itemWithImageUrl,});

    res.status(200).json({
      message: 'Next item retrieved successfully',
      type: itemType,
      item: itemWithImageUrl,
    });
  } catch (error) {
    console.error("Next question error:", error);
    res.status(500).json({ message: "Error retrieving the next item", error });
  }
};

// end the session
exports.endSession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Find the session
    const session = await Session.findOne({ joinCode, _id: sessionId })
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Update session status
    session.status = "completed";
    session.endTime = Date.now();
    await session.save();

    // Generate reports
    const reports = [];
    for (const player of session.players) {
      const userId = player._id;

      // Debug log for player ID
      console.log(`Processing player: ${userId}`);

      // Fetch leaderboard entry
      const leaderboardEntry = await Leaderboard.findOne({ player: userId, session: sessionId });
      if (!leaderboardEntry) {
        console.warn(`No leaderboard entry found for user ${userId} in session ${sessionId}`);
      }

      // Ensure leaderboard score
      const leaderboardScore = leaderboardEntry ? leaderboardEntry.score : 0;

      // Log score details
      console.log(`User ID: ${userId}, Leaderboard Score: ${leaderboardScore}`);

      // Calculate stats from Answer model
      const totalQuestions = await Answer.countDocuments({ session: sessionId, user: userId });
      const correctAnswers = await Answer.countDocuments({ session: sessionId, user: userId, isCorrect: true });
      const incorrectAnswers = totalQuestions - correctAnswers;

      // Log calculated stats
      console.log({
        userId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        totalScore: leaderboardScore,
      });

      // Save report
      const report = await Report.create({
        quiz: session.quiz,
        user: userId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        totalScore: leaderboardScore,
        completedAt: session.endTime,
      });

      console.log("Report saved successfully:", report);
      reports.push(report);
    }

    // Emit socket event
    const io = req.app.get("socketio");
    io.emit("session-ended", { session });

    // Respond with success
    res.status(200).json({
      message: "Session ended successfully and reports generated",
      session,
      reports,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({ message: "Error ending the session and generating reports", error });
  }
};

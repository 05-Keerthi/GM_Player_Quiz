// socketService.js
import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.SOCKET_URL = "http://localhost:5000";
  }

  connect() {
    if (!this.socket) {
      this.socket = io(this.SOCKET_URL);
      this.socket.on("connect", () => {
        console.log("Connected to socket server");
      });
    }
    return this.socket;
  }

  // Admin Methods
  createSession(sessionId, joinCode) {
    return new Promise((resolve) => {
      this.socket.emit(
        "create-session",
        { sessionId, joinCode },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  startSession(sessionId) {
    return new Promise((resolve) => {
      this.socket.emit("start-session", { sessionId }, (response) => {
        resolve(response);
      });
    });
  }

  changeQuestion(sessionId, question) {
    return new Promise((resolve) => {
      this.socket.emit(
        "change-question",
        { sessionId, question },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  endSession(sessionId) {
    return new Promise((resolve) => {
      this.socket.emit("end-session", { sessionId }, (response) => {
        resolve(response);
      });
    });
  }

  // Player Methods
  joinSession(sessionId, joinCode) {
    return new Promise((resolve) => {
      this.socket.emit("join-session", { sessionId, joinCode }, (response) => {
        resolve(response);
      });
    });
  }

  submitAnswer(sessionId, answerDetails) {
    return new Promise((resolve) => {
      this.socket.emit(
        "answer-submitted",
        { sessionId, answerDetails },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  // Event Listeners
  onSessionCreated(callback) {
    this.socket.on("session-created", callback);
  }

  onSessionStarted(callback) {
    this.socket.on("session-started", callback);
  }

  onQuestionChanged(callback) {
    this.socket.on("question-changed", callback);
  }

  onAnswerUpdated(callback) {
    this.socket.on("answer-updated", callback);
  }

  onSessionEnded(callback) {
    this.socket.on("session-ended", callback);
  }

  onUpdateSession(callback) {
    this.socket.on("update-session", callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

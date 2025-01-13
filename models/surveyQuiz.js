const mongoose = require("mongoose");

const SurveyquizSchema = new mongoose.Schema({
  title: { type: String, required: false },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  type: { type: String, enum: ["survey", "ArtPulse"] },
  categories: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  ],
  slides: [{ type: mongoose.Schema.Types.ObjectId, ref: "SurveySlide" }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "SurveyQuestion" }],
  order: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      type: { type: String, enum: ["question", "slide"], required: true },
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["draft", "active", "closed"],
    default: "draft",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SurveyQuiz", SurveyquizSchema);

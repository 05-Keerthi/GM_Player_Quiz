const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const forgetRoutes = require('./routes/forgetRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const questionRoutes = require('./routes/questionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const slideRoutes = require('./routes/slideRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const leaderBoardRoutes = require('./routes/leaderBoardRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes = require('./routes/ActivityLogRoutes');
const surveyQuestionRoutes = require('./routes/surveyQuestionRoutes');
const surveyQuizRoutes = require('./routes/surveyQuizRoutes');
const surveySessionRoutes = require('./routes/surveySessionRoutes');

const path = require('path');

require('./config/env'); 

const app = express();
app.use(cors());
app.use(express.json());

logger(app); 

app.use('/api', authRoutes);
app.use('/api', userRoutes); 
app.use('/api', forgetRoutes);
app.use('/api', tenantRoutes);
app.use('/api', categoryRoutes);
app.use('/api', mediaRoutes);
app.use('/api', questionRoutes);
app.use('/api', quizRoutes);
app.use('/api', slideRoutes);
app.use('/api', sessionRoutes);
app.use('/api', answerRoutes);
app.use('/api', leaderBoardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', activityRoutes);

app.use('/api', surveyQuestionRoutes);
app.use('/api', surveyQuizRoutes);
app.use('/api', surveySessionRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;

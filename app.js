const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const forgetRoutes = require('./routes/forgetRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


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

module.exports = app;

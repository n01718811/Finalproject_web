/**
 * Main application file for Movie Management App
 * Authors: Tien Dung Pham (n01718811) & Kaushalya Satharasinghe (n01718508)
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Initialize Express app
const app = express();

// Database configuration and connection
const config = require('./config/database');

// Updated MongoDB connection without deprecated options
mongoose.connect(process.env.MONGO_URI || config.database)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Passport configuration
require('./config/passport')(passport);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages middleware
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Debug: Check if routes are loading
console.log('Loading routes...');
console.log('Index route:', require('./routes/index'));
console.log('Users route:', require('./routes/users'));
console.log('Movies route:', require('./routes/movies'));

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/movies', require('./routes/movies'));

console.log('All routes loaded successfully');

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/movies', require('./routes/movies'));

// Error handling middleware
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
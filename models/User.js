/**
 * User model for authentication and user data
 * Author: Kaushalya Satharasinghe (n01718508)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create and export User model
module.exports = mongoose.model('User', userSchema);
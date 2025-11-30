/**
 * Movie model for storing movie data with user relationships
 * Author: Tien Dung Pham (n01718811)
 */

const mongoose = require('mongoose');

// Available genres for movies
const availableGenres = [
  'Action', 'Comedy', 'Drama', 'Horror', 
  'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'
];

const movieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Movie name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1900, 'Year must be 1900 or later'],
    max: [2025, 'Year cannot be greater than 2025']
  },
  genres: {
    type: [String],
    required: [true, 'At least one genre is required'],
    validate: {
      validator: function(genres) {
        return genres.length > 0 && 
               genres.every(genre => availableGenres.includes(genre));
      },
      message: 'Please select valid genres from the available options'
    }
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be between 1 and 10'],
    max: [10, 'Rating must be between 1 and 10']
  },
  coverImage: {
    type: String,
    default: '/images/default-movie.jpg'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for efficient user-specific queries
movieSchema.index({ userId: 1, createdAt: -1 });

// Create and export Movie model
module.exports = mongoose.model('Movie', movieSchema);
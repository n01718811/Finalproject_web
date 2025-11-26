/**
 * Authentication and authorization middleware
 * Author: Tien Dung Pham (n01718811)
 */

const Movie = require('../models/Movie');

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/users/login');
};

// Check if user owns the movie
exports.checkMovieOwnership = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      req.flash('error_msg', 'Movie not found');
      return res.redirect('/movies');
    }
    
    // Check if user owns the movie
    if (movie.userId.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'You are not authorized to perform this action');
      return res.redirect('/movies');
    }
    
    next();
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error checking movie ownership');
    res.redirect('/movies');
  }
};
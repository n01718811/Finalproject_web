/**
 * Movie management routes (CRUD operations)
 * Handles all movie-related operations including listing, filtering, adding, editing, and deleting
 * Authors: 
 * - Tien Dung Pham (n01718811) - List, Filter, Edit, Delete, View Details
 * - Kaushalya Satharasinghe (n01718508) - Add Movie
 */

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Movie = require('../models/Movie');
const { isAuthenticated, checkMovieOwnership } = require('../middleware/auth');

// Available genres for validation and display
const availableGenres = [
  'Action', 'Comedy', 'Drama', 'Horror', 
  'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'
];

/**
 * GET /movies
 * Display all movies for the authenticated user
 * Sorted by creation date (newest first)
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Fetch all movies belonging to the logged-in user
    const movies = await Movie.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.render('movies', {
      title: 'My Movies',
      movies: movies
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching movies');
    res.redirect('/');
  }
});

/**
 * GET /movies/filter
 * Display the filter page with all movies
 * Users can then apply filters using the form
 */
router.get('/filter', isAuthenticated, async (req, res) => {
  try {
    // Fetch all movies for initial display
    const movies = await Movie.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.render('filterMovies', {
      title: 'Filter Movies',
      movies: movies,
      filtered: false,
      availableGenres: availableGenres
    });
  } catch (err) {
    console.error('Error in GET /movies/filter:', err);
    req.flash('error_msg', 'Error fetching movies');
    res.redirect('/movies');
  }
});

/**
 * POST /movies/filter
 * Handle movie filtering based on user-submitted criteria
 * Filters: name, genre, year range, rating range
 */
router.post('/filter', isAuthenticated, async (req, res) => {
  try {
    
    const { name, genre, minYear, maxYear, minRating, maxRating } = req.body;
    
    // Build filter object dynamically based on provided criteria
    let filter = { userId: req.user._id };
    
    // Case-insensitive name search using regex
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    // Filter by genre (if not "all")
    if (genre && genre !== 'all') {
      filter.genres = genre;
    }
    
    // Filter by year range
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = parseInt(minYear);
      if (maxYear) filter.year.$lte = parseInt(maxYear);
    }
    
    // Filter by rating range
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseFloat(minRating);
      if (maxRating) filter.rating.$lte = parseFloat(maxRating);
    }

    // Execute filter query
    const movies = await Movie.find(filter).sort({ createdAt: -1 });

    res.render('filterMovies', {
      title: 'Filtered Movies',
      movies: movies,
      filtered: true,
      filters: req.body,
      availableGenres: availableGenres
    });
    
  } catch (err) {
    console.error('Error in POST /movies/filter:', err);
    req.flash('error_msg', 'Error filtering movies');
    res.redirect('/movies/filter');
  }
});

/**
 * GET /movies/add
 * Display the form to add a new movie
 */
router.get('/add', isAuthenticated, (req, res) => {
  res.render('addMovie', {
    title: 'Add New Movie',
    availableGenres: availableGenres
  });
});

/**
 * POST /movies/add
 * Handle new movie creation with validation
 * Validates: name, description (10+ chars), year (1900-2025), genres, rating (1-10)
 */
router.post('/add', isAuthenticated, [
  // Validation rules
  check('name', 'Movie name is required').not().isEmpty().trim().escape(),
  check('description', 'Description must be at least 10 characters')
    .isLength({ min: 10 }).trim().escape(),
  check('year', 'Please enter a valid year between 1900 and 2025')
    .isInt({ min: 1900, max: 2025 }),
  check('genres', 'Please select at least one genre')
    .custom((value) => {
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      return typeof value === 'string' && value.trim().length > 0;
    }),
  check('rating', 'Please enter a rating between 1 and 10')
    .isFloat({ min: 1, max: 10 }),
  check('coverImage')
    .custom((value) => {
      if (!value || value.trim() === '') return true;

      try {
        new URL(value);
        return true;
      } catch (e) {
        throw new Error('Please enter a valid image URL');
      }
    }),
    
], async (req, res) => {
  const errors = validationResult(req);
  
  // If validation fails, re-render form with errors
  if (!errors.isEmpty()) {
    return res.render('addMovie', {
      title: 'Add New Movie',
      errors: errors.array(),
      availableGenres: availableGenres,
      formData: req.body
    });
  }

  try {
    const { name, description, year, genres, rating, coverImage } = req.body;
    
    // Ensure genres are valid
    const validGenres = Array.isArray(genres) 
      ? genres.filter(genre => availableGenres.includes(genre))
      : [genres].filter(genre => availableGenres.includes(genre));

    // Use default image if none provided
    const DEFAULT_IMAGE_URL = "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/396e9/MainBefore.jpg";

    let movieCoverImage =
      coverImage && coverImage.trim() !== ""
        ? coverImage.trim()
        : DEFAULT_IMAGE_URL;

    // Create new movie document
    const newMovie = new Movie({
      name,
      description,
      year: parseInt(year),
      genres: validGenres,
      rating: parseFloat(rating),
      coverImage: movieCoverImage,
      userId: req.user._id // Links movie to authenticated user
    });

    await newMovie.save();
    
    req.flash('success_msg', 'Movie added successfully');
    res.redirect('/movies');
    
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding movie');
    res.redirect('/movies/add');
  }
});

/**
 * GET /movies/edit/:id
 * Display the form to edit an existing movie
 * Requires ownership verification
 */
router.get('/edit/:id', isAuthenticated, checkMovieOwnership, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      req.flash('error_msg', 'Movie not found');
      return res.redirect('/movies');
    }
    
    res.render('editMovie', {
      title: 'Edit Movie',
      movie: movie,
      availableGenres: availableGenres
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching movie');
    res.redirect('/movies');
  }
});

/**
 * POST /movies/edit/:id
 * Handle movie update with validation
 * Requires ownership verification
 */
router.post('/edit/:id', isAuthenticated, checkMovieOwnership, [
  // Validation rules (same as add)
  check('name', 'Movie name is required').not().isEmpty().trim().escape(),
  check('description', 'Description must be at least 10 characters')
    .isLength({ min: 10 }).trim().escape(),
  check('year', 'Please enter a valid year between 1900 and 2025')
    .isInt({ min: 1900, max: 2025 }),
  check('genres', 'Please select at least one genre')
    .custom((value) => {
      if (!value) return false;
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return typeof value === 'string' && value.trim().length > 0;
    }),
    
  check('rating', 'Please enter a rating between 1 and 10')
    .isFloat({ min: 1, max: 10 }),
  check('coverImage')
    .custom((value) => {
      if (!value || value.trim() === '') return true;

      try {
        new URL(value);
        return true;
      } catch (e) {
        throw new Error('Please enter a valid image URL');
      }
    }),
    
], async (req, res) => {
  const errors = validationResult(req);
  
  // If validation fails, re-render form with errors
  if (!errors.isEmpty()) {
    try {
      const movie = await Movie.findById(req.params.id);
      
      return res.render('editMovie', {
        title: 'Edit Movie',
        errors: errors.array(),
        movie: movie,
        availableGenres: availableGenres,
        formData: req.body
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading movie data');
      return res.redirect('/movies');
    }
  }

  try {
    const { name, description, year, genres, rating, coverImage } = req.body;
    
    // Ensure genres are valid
    const validGenres = Array.isArray(genres) 
      ? genres.filter(genre => availableGenres.includes(genre))
      : [genres].filter(genre => availableGenres.includes(genre));

    // Use default image if none provided
    const DEFAULT_IMAGE_URL = "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/396e9/MainBefore.jpg";
    
    let movieCoverImage =
      coverImage && coverImage.trim() !== ""
        ? coverImage.trim()
        : DEFAULT_IMAGE_URL;

    // Update movie in database
    await Movie.findByIdAndUpdate(req.params.id, {
      name,
      description,
      year: parseInt(year),
      genres: validGenres,
      rating: parseFloat(rating),
      coverImage: movieCoverImage
    });

    req.flash('success_msg', 'Movie updated successfully');
    res.redirect('/movies');
    
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating movie');
    res.redirect(`/movies/edit/${req.params.id}`);
  }
});

/**
 * POST /movies/delete/:id
 * Handle movie deletion
 * Requires ownership verification
 */
router.post('/delete/:id', isAuthenticated, checkMovieOwnership, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    await Movie.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', `"${movie.name}" deleted successfully`);
    res.redirect('/movies');
    
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting movie');
    res.redirect('/movies');
  }
});

/**
 * GET /movies/:id
 * Display detailed information about a single movie
 * Only accessible by the movie owner
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Fetch movie only if it belongs to the logged-in user
    const movie = await Movie.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!movie) {
      req.flash('error_msg', 'Movie not found');
      return res.redirect('/movies');
    }

    // Check if user is the owner
    const isOwner = movie.userId.toString() === req.user._id.toString();

    res.render('movieDetails', {
      title: 'Movie Details',
      movie,
      isOwner
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading movie details');
    res.redirect('/movies');
  }
});

// Export router
module.exports = router;
/**
 * Movie management routes (CRUD operations)
 * Authors: 
 * - Tien Dung Pham (n01718811) - List, Edit, Delete, Filter
 * - Kaushalya Satharasinghe (n01718508) - Add
 */

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Movie = require('../models/Movie');
const { isAuthenticated, checkMovieOwnership } = require('../middleware/auth');

// Available genres for validation
const availableGenres = [
  'Action', 'Comedy', 'Drama', 'Horror', 
  'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'
];

// GET all movies for authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
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

// GET filter movies page - THIS IS THE ROUTE THAT'S MISSING
router.get('/filter', isAuthenticated, async (req, res) => {
  try {
    console.log('GET /movies/filter route hit'); // Debug log
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

// POST handle movie filtering
router.post('/filter', isAuthenticated, async (req, res) => {
  try {
    console.log('POST /movies/filter route hit'); // Debug log
    const { name, genre, minYear, maxYear, minRating, maxRating } = req.body;
    
    // Build filter object
    let filter = { userId: req.user._id };
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    if (genre && genre !== 'all') {
      filter.genres = genre;
    }
    
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = parseInt(minYear);
      if (maxYear) filter.year.$lte = parseInt(maxYear);
    }
    
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseFloat(minRating);
      if (maxRating) filter.rating.$lte = parseFloat(maxRating);
    }

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

// GET form to add new movie
router.get('/add', isAuthenticated, (req, res) => {
  res.render('addMovie', {
    title: 'Add New Movie',
    availableGenres: availableGenres
  });
});

// POST handle new movie creation
router.post('/add', isAuthenticated, [
  check('name', 'Movie name is required').not().isEmpty().trim().escape(),
  check('description', 'Description must be at least 10 characters')
    .isLength({ min: 10 }).trim().escape(),
  check('year', 'Please enter a valid year between 1900 and current year')
    .isInt({ min: 1900, max: new Date().getFullYear() }),
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
    
    const validGenres = Array.isArray(genres) 
      ? genres.filter(genre => availableGenres.includes(genre))
      : [genres].filter(genre => availableGenres.includes(genre));

    const DEFAULT_IMAGE_URL = "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/396e9/MainBefore.jpg";

    let movieCoverImage =
      coverImage && coverImage.trim() !== ""
        ? coverImage.trim()
        : DEFAULT_IMAGE_URL;


    const newMovie = new Movie({
      name,
      description,
      year: parseInt(year),
      genres: validGenres,
      rating: parseFloat(rating),
      coverImage: movieCoverImage,
      userId: req.user._id
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

// GET form to edit existing movie
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

// POST handle movie update
router.post('/edit/:id', isAuthenticated, checkMovieOwnership, [
  check('name', 'Movie name is required').not().isEmpty().trim().escape(),
  check('description', 'Description must be at least 10 characters')
    .isLength({ min: 10 }).trim().escape(),
  check('year', 'Please enter a valid year between 1900 and current year')
    .isInt({ min: 1900, max: new Date().getFullYear() }),
  check('genres', 'Please select at least one genre')
    .custom((value) => {
      if (!value) return false;                // không chọn gì -> fail
      if (Array.isArray(value)) {             // chọn 2+ checkbox -> array
        return value.length > 0;
      }
      // chọn 1 checkbox -> string -> vẫn chấp nhận
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
    
    const validGenres = Array.isArray(genres) 
      ? genres.filter(genre => availableGenres.includes(genre))
      : [genres].filter(genre => availableGenres.includes(genre));

    const DEFAULT_IMAGE_URL = "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/396e9/MainBefore.jpg";

    let movieCoverImage =
      coverImage && coverImage.trim() !== ""
        ? coverImage.trim()
        : DEFAULT_IMAGE_URL;

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

// POST handle movie deletion
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
// GET movie details by id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Chỉ lấy movie thuộc đúng user đang login
    const movie = await Movie.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!movie) {
      req.flash('error_msg', 'Movie not found');
      return res.redirect('/movies');
    }

    res.render('movieDetails', {
      title: 'Movie Details',
      movie
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading movie details');
    res.redirect('/movies');
  }
});

// Export router
module.exports = router;
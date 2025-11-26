/**
 * User authentication routes (register, login, logout)
 * Authors: 
 * - Kaushalya Satharasinghe (n01718508) - Register, Logout
 * - Tien Dung Pham (n01718811) - Login
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');

// GET register page
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register'
  });
});

// POST handle user registration
router.post('/register', [
  // Validation rules
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('confirm_password', 'Passwords do not match').custom((value, { req }) => {
    return value === req.body.password;
  })
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return validation errors
    return res.render('register', {
      title: 'Register',
      errors: errors.array(),
      name: req.body.name,
      email: req.body.email
    });
  }

  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        errors: [{ msg: 'User with this email already exists' }],
        name: req.body.name,
        email: req.body.email
      });
    }

    // Create new user with hashed password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/users/login');
    
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error during registration');
    res.redirect('/users/register');
  }
});

// GET login page
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  });
});

// POST handle user login
router.post('/login', [
  // Validation rules
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Login',
      errors: errors.array(),
      email: req.body.email
    });
  }

  // Authenticate using Passport
  passport.authenticate('local', {
    successRedirect: '/movies',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// GET handle user logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

module.exports = router;
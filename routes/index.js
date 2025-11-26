/**
 * Main routes for the application
 * Author: Kaushalya Satharasinghe (n01718508)
 */

const express = require('express');
const router = express.Router();

// GET home page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Movie Management App',
    user: req.user
  });
});

module.exports = router;
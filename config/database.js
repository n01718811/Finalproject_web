/**
 * Database configuration
 * Author: Kaushalya Satharasinghe (n01718508)
 */

module.exports = {
  database: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moviemanagement',
  secret: process.env.SESSION_SECRET || 'fallback_secret'
};
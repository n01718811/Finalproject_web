/**
 * Client-side JavaScript for Movie Management App
 * Handles form validation, flash messages, and user interactions
 * Authors: 
 * - Tien Dung Pham (n01718811) - Filter validation, year range validation
 * - Kaushalya Satharasinghe (n01718508) - Flash messages, form validation
 */

// Auto-hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  // Get all flash message elements
  const flashMessages = document.querySelectorAll('.alert');
  
  // Auto-hide each message after 5 seconds with fade out animation
  flashMessages.forEach(message => {
    setTimeout(() => {
      message.style.transition = 'opacity 0.5s ease';
      message.style.opacity = '0';
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 500);
    }, 5000);
  });

  // Enhanced form validation for required fields
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      // Check each required field for empty values
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#e74c3c';
        } else {
          field.style.borderColor = '';
        }
      });
      
      // Prevent submission if validation fails
      if (!isValid) {
        e.preventDefault();
        alert('Please fill in all required fields.');
      }
    });
  });

  // Rating input enhancement - Restrict values between 1 and 10
  const ratingInputs = document.querySelectorAll('input[name="rating"]');
  ratingInputs.forEach(input => {
    input.addEventListener('input', function() {
      const value = parseFloat(this.value);
      if (value < 1) this.value = 1;
      if (value > 10) this.value = 10;
    });
  });

  // Year input enhancement - Allow free typing with validation
  const yearInputs = document.querySelectorAll('input[name="year"], input[name="minYear"], input[name="maxYear"]');
  yearInputs.forEach(input => {
    // Allow only numbers as user types
    input.addEventListener('input', function(e) {
      // Remove any non-digit characters
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Limit to 4 digits
      if (this.value.length > 4) {
        this.value = this.value.slice(0, 4);
      }
    });

    // Validate on blur (when user leaves the field)
    input.addEventListener('blur', function() {
      const value = parseInt(this.value);
      
      // If empty, that's okay for filter fields
      if (!this.value) return;
      
      // Validate range between 1900 and 2025
      if (value < 1900) {
        alert('Year must be 1900 or later');
        this.value = '1900';
        this.focus();
      } else if (value > 2025) {
        alert('Year cannot be greater than 2025');
        this.value = '2025';
        this.focus();
      }
    });
  });
});


/**
 * Delete confirmation dialog for movies
 * @param {string} movieName - Name of the movie to delete
 * @returns {boolean} - True if user confirms, false otherwise
 */
function confirmDelete(movieName) {
  return confirm(`Are you sure you want to delete "${movieName}"? This action cannot be undone.`);
}

// Filter form enhancement - Year and rating range validation
document.addEventListener('DOMContentLoaded', function() {
  // Year range validation for filter form
  const minYearInput = document.querySelector('input[name="minYear"]');
  const maxYearInput = document.querySelector('input[name="maxYear"]');
  
  if (minYearInput && maxYearInput) {
    // Ensure min year doesn't exceed max year
    minYearInput.addEventListener('input', function() {
      const minValue = parseInt(this.value);
      const maxValue = parseInt(maxYearInput.value);
      
      if (minValue && maxValue && minValue > maxValue) {
        maxYearInput.value = minValue;
      }
    });
    
    // Ensure max year doesn't go below min year
    maxYearInput.addEventListener('input', function() {
      const minValue = parseInt(minYearInput.value);
      const maxValue = parseInt(this.value);
      
      if (minValue && maxValue && maxValue < minValue) {
        minYearInput.value = maxValue;
      }
    });
  }

  // Rating range validation for filter form
  const minRatingInput = document.querySelector('input[name="minRating"]');
  const maxRatingInput = document.querySelector('input[name="maxRating"]');
  
  if (minRatingInput && maxRatingInput) {
    // Ensure min rating doesn't exceed max rating and stays in valid range
    minRatingInput.addEventListener('input', function() {
      const minValue = parseFloat(this.value);
      const maxValue = parseFloat(maxRatingInput.value);
      
      if (minValue && maxValue && minValue > maxValue) {
        maxRatingInput.value = minValue;
      }
      
      // Enforce 1-10 range
      if (minValue < 1) this.value = 1;
      if (minValue > 10) this.value = 10;
    });
    
    // Ensure max rating doesn't go below min rating and stays in valid range
    maxRatingInput.addEventListener('input', function() {
      const minValue = parseFloat(minRatingInput.value);
      const maxValue = parseFloat(this.value);
      
      if (minValue && maxValue && maxValue < minValue) {
        minRatingInput.value = maxValue;
      }
      
      // Enforce 1-10 range
      if (maxValue < 1) this.value = 1;
      if (maxValue > 10) this.value = 10;
    });
  }
});
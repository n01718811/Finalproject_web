/**
 * Client-side JavaScript for Movie Management App
 * Author: Tien Dung Pham (n01718811)
 */

// Auto-hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const flashMessages = document.querySelectorAll('.alert');
  
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

  // Enhanced form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#e74c3c';
        } else {
          field.style.borderColor = '';
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        alert('Please fill in all required fields.');
      }
    });
  });

  // Rating input enhancement
  const ratingInputs = document.querySelectorAll('input[name="rating"]');
  ratingInputs.forEach(input => {
    input.addEventListener('input', function() {
      const value = parseFloat(this.value);
      if (value < 1) this.value = 1;
      if (value > 10) this.value = 10;
    });
  });

  // Year input enhancement
  const yearInputs = document.querySelectorAll('input[name="year"]');
  yearInputs.forEach(input => {
    input.addEventListener('input', function() {
      const value = parseInt(this.value);
      const currentYear = new Date().getFullYear();
      if (value < 1900) this.value = 1900;
      if (value > currentYear) this.value = currentYear;
    });
  });

  
});

// Delete confirmation for movies
function confirmDelete(movieName) {
  return confirm(`Are you sure you want to delete "${movieName}"? This action cannot be undone.`);
}


// Filter form enhancement
document.addEventListener('DOMContentLoaded', function() {
  // Year range validation for filter
  const minYearInput = document.querySelector('input[name="minYear"]');
  const maxYearInput = document.querySelector('input[name="maxYear"]');
  
  if (minYearInput && maxYearInput) {
    minYearInput.addEventListener('input', function() {
      const minValue = parseInt(this.value);
      const maxValue = parseInt(maxYearInput.value);
      
      if (minValue && maxValue && minValue > maxValue) {
        maxYearInput.value = minValue;
      }
    });
    
    maxYearInput.addEventListener('input', function() {
      const minValue = parseInt(minYearInput.value);
      const maxValue = parseInt(this.value);
      
      if (minValue && maxValue && maxValue < minValue) {
        minYearInput.value = maxValue;
      }
    });
  }

  // Rating range validation for filter
  const minRatingInput = document.querySelector('input[name="minRating"]');
  const maxRatingInput = document.querySelector('input[name="maxRating"]');
  
  if (minRatingInput && maxRatingInput) {
    minRatingInput.addEventListener('input', function() {
      const minValue = parseFloat(this.value);
      const maxValue = parseFloat(maxRatingInput.value);
      
      if (minValue && maxValue && minValue > maxValue) {
        maxRatingInput.value = minValue;
      }
      
      if (minValue < 1) this.value = 1;
      if (minValue > 10) this.value = 10;
    });
    
    maxRatingInput.addEventListener('input', function() {
      const minValue = parseFloat(minRatingInput.value);
      const maxValue = parseFloat(this.value);
      
      if (minValue && maxValue && maxValue < minValue) {
        minRatingInput.value = maxValue;
      }
      
      if (maxValue < 1) this.value = 1;
      if (maxValue > 10) this.value = 10;
    });
  }
});
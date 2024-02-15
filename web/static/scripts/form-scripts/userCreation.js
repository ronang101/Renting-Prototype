/**
 * This script is dedicated to handling the user profile creation process on the Redwood Prototype platform. It includes the setup for dropdowns,
 * image upload validation, and form submission handling. The script ensures that all user inputs meet the platform's requirements before
 * submission, aiming to provide a smooth and error-free user onboarding experience.
 *
 * Dependencies:
 * - jQuery: For DOM manipulation and handling AJAX requests.
 * - Select2: Used for enhancing the select dropdowns with search capabilities.
 * - MapLibre: A JavaScript library for interactive maps, used to render the map and handle user interactions.
 *
 * Key Functionalities:
 * - DOMContentLoaded event listener: Ensures that the script runs only after the full document is loaded.
 * - Form validation: Checks for the move-in date range and image file size to ensure they meet the defined constraints.
 *
 * Event Listeners:
 * - 'DOMContentLoaded': Initializes form elements and sets up event listeners for form validation and submission.
 * - Form 'submit': Validates the move-in date range and profile image file size upon form submission.
 *
 * Imported Modules:
 * - setupDropdowns: Initializes dropdown elements with options and default settings.
 * - setupProfileImageUpload: Configures the profile image upload functionality, including preview and validation.
 * - setupIsochroneInput: Sets up the map input for selecting an isochrone area.
 *
 */

/* global $ */

import { setupDropdowns } from '../modules/signUp/profileCreationFormPopulation.js'
import { setupProfileImageUpload } from '../modules/signUp/profileImageSetup.js'
import { setupIsochroneInput } from '../modules/signUp/isochroneInput.js'

// Listen for the DOMContentLoaded event to ensure the DOM is fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {
  // Code inside this block will run after the DOM is fully loaded.
  // Set up the dropdowns used in the sign up form.
  setupDropdowns()
  // Set up the profile image upload functionality.
  setupProfileImageUpload()
  // Set up the isochrone input functionality.
  setupIsochroneInput()

  // Initialize Select2 for the 'features' dropdown to enhance user interaction.
  $('#features').select2({
    placeholder: 'Select features',
    allowClear: true
  })

  // Validate form submission, specifically checking the move-in date range and profile image file size.
  document.getElementById('profile_form').onsubmit = function (e) {
    // Validate the move-in date range.
    const moveInDateStart = new Date(document.getElementById('move_in_date_start').value)
    const moveInDateEnd = new Date(document.getElementById('move_in_date_end').value)

    // Calculate the difference in days
    const timeDiff = moveInDateEnd - moveInDateStart
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

    // Check if the dates are at most 28 days apart
    if (daysDiff > 28 || daysDiff < 0) {
      alert('The move-in date range must be at most 28 days apart.')
      e.preventDefault() // Prevent form submission
      return false
    }

    // Validate the profile image file size.
    const profileImage = document.getElementById('profile_image')
    if (profileImage.files.length > 0) {
      const fileSize = profileImage.files[0].size / 1024 / 1024 // in MB
      if (fileSize > 5) { // Set a limit of 5MB for the image file
        alert('File size exceeds 5 MB')
        e.preventDefault()
        return false
      }
    }

    return true // Allow form submission if all validations pass.
  }
})

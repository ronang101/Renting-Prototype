/**
 * This script facilitates the profile editing process for users on the Redwood Prototype platform. It leverages global variables to prefill
 * form fields based on existing user data, allowing users to update their profile information seamlessly. Key functionalities include initializing
 * dropdowns with user data, handling profile image uploads, setting up isochrone inputs for geographic preferences, managing side menu interactions,
 * and resetting user preferences. This is very similar to the user sign up form but with pre populated elements and the ability to delete your account.
 *
 * Dependencies:
 * - jQuery: Utilized for DOM manipulation and to simplify AJAX requests.
 * - Select2: Enhances HTML select elements with support for search, tagging, and placeholder texts.
 * - MapLibre: A JavaScript library for interactive maps, used to render the map and handle user interactions.
 *
 * Key Functionalities:
 * - DOMContentLoaded event listener: Ensures that script execution waits until the full document content is loaded, guaranteeing that all HTML
 *   elements are accessible.
 * - Form submission validation: Checks the validity of the move-in date range and other form fields to ensure they meet predefined criteria.
 * - Account deletion handling: Provides functionality for users to request account deletion with confirmation modal dialogs.
 *
 * Event Listeners:
 * - 'DOMContentLoaded': Initializes form elements and sets up functionalities as soon as the document is ready.
 * - Form 'submit': Validates form data before submission, particularly the move-in date range, to ensure compliance with platform policies.
 * - Account deletion buttons: Manages the display and interaction of the account deletion confirmation modal.
 *
 * Imported Modules:
 * - setupDropdowns: Configures dropdown menus with user-specific selections already selected.
 * - setupProfileImageUpload: Implements profile image upload functionality, including preview and file validation.
 * - setupIsochroneInput: Initializes inputs for defining user geographic preferences using map-based isochrone selections.
 * - setupSideMenu: Manages interactions with the side navigation menu, ensuring responsive behavior and easy navigation of the site.
 * - setupResetPreferences: Enables the resetting of user preferences with an interactive confirmation step.
 * - getImage: Fetches and displays the user's profile image from the server or defaults to a placeholder if not available.
 *
 * This script plays a critical role in maintaining user data accuracy and integrity by providing a user-friendly interface for profile updates
 * while ensuring data validation and secure account management practices.
 */

/* global $, userId, age, rent, duration, university, selectedCity, profession, userFeatures, userLongitude, userLatitude, userTransportMode, userTravelTime */

import { setupDropdowns } from '../modules/signUp/profileCreationFormPopulation.js'
import { setupProfileImageUpload } from '../modules/signUp/profileImageSetup.js'
import { setupIsochroneInput } from '../modules/signUp/isochroneInput.js'
import { setupSideMenu } from '../modules/utils/sideMenu.js'
import { setupResetPreferences } from '../modules/signUp/resetPreferences.js'
import { getImage } from '../modules/utils/api.js'

// Listen for the DOMContentLoaded event to ensure the DOM is fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {
  // Code inside this block will run after the DOM is fully loaded.
  // Initialize user selections dictionary with user-specific data in order to pre-populate fields.
  const userSelections = {
    age,
    rent,
    duration,
    university,
    selectedCity,
    profession,
    userFeatures
  }

  // Set up the dropdowns used in the sign up form and pre-populate the fields.
  setupDropdowns(userSelections)
  // Set up the profile image upload functionality.
  setupProfileImageUpload()
  // Set up the isochrone input functionality.
  setupIsochroneInput(userLongitude, userLatitude, userTransportMode, userTravelTime)

  // Initialize Select2 with placeholders and allowClear option for both 'features' and 'preferences' selects for better UX.
  $('#features').select2({
    placeholder: 'Select features',
    allowClear: true
  })
  $('#preferences').select2({
    placeholder: 'Select preferences',
    allowClear: true
  })

  // Initialize the side menu for easy navigation of the site.
  setupSideMenu()
  // Initialize the confirmation box to ensure users do not accidently reset their preferences.
  setupResetPreferences()
  // Form submission handler with validation for the move-in date range.
  document.getElementById('profile_form').onsubmit = function (e) {
    // Validate the move-in date range before form submission.
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

    return true // Proceed with form submission if validation passes.
  }

  // Manage account deletion confirmation through modal interactions.
  // Event listeners for handling account deletion confirmation.
  document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    document.getElementById('confirmationModal').style.display = 'block' // Show the confirmation modal
  })

  document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('confirmationModal').style.display = 'none' // Hide the confirmation modal
  })

  document.getElementById('confirmDelete').addEventListener('click', () => {
    document.getElementById('deleteAccountForm').submit() // Submit the form to delete the account
    alert('Account deleted successfully.') // Placeholder alert
  })
  // Attempt to fetch and display the user's profile image.
  getImage(userId).then(presignedUrl => {
    document.getElementById('image-preview').src = presignedUrl
  })
    .catch(error => {
      console.error('Error fetching image:', error)
      document.getElementById('image-preview').src = '/static/images/vecteezy_default-profile-account-unknown-icon-black-silhouette_20765399.jpg'
    })
})

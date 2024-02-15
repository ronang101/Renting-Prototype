/**
 * Initializes and populates dropdown menus for the user profile creation and editing forms in the Redwood Prototype application.
 * This includes dropdowns for age filter, rent filter, duration, university selection, city selection, profession, user features, and preferences.
 *
 * Key Functionalities:
 * - Dynamically populates dropdown options based on predefined lists and previous user selections.
 * - Utilizes the Select2 library to enhance select elements with search capabilities and better UX.
 * - Supports multi-select for features and preferences with an option to clear selections.
 *
 * How It Works:
 * - The function receives an object `userSelections` containing previous user selections or defaults to an empty object.
 * - For each dropdown, it calls `populateDropdown`, which adds options to the select element and marks the appropriate options as selected based on `userSelections`.
 * - Initializes Select2 for enhanced dropdown functionality, including search and clear options.
 *
 * External Dependencies:
 * - jQuery: Used for DOM manipulation and initializing Select2 on select elements.
 * - Select2: A jQuery-based library that replaces standard select elements with enhanced versions.
 *
 * Usage:
 * - Called during page load for profile creation or editing to setup dropdowns with user data or default values.
 *
 */

/* global $ */

// Imports the lists of cities, universities, and features from a centralized file.
import { cities, universities, features } from '../variables/userCreationLists.js'

// Main function to initialize and populate dropdowns.
export function setupDropdowns (userSelections = {}) {
  // Destructures the userSelections object to extract individual dropdown values.
  const {
    age,
    rent,
    duration,
    university,
    selectedCity,
    profession,
    userFeatures,
    preferences = [] // Adding preferences with a default empty array.
  } = userSelections

  // Populates each dropdown with the appropriate options and marks selected values if any are present.
  populateDropdown('age_filter', ['My Age +/- 1 year', 'My Age +/- 2 years', 'My Age +/- 3 years', 'My Age +/- 4 years', 'My Age +/- 5 years'], age)
  populateDropdown('rent_filter', ['My Budget +/- £50', 'My Budget +/- £100', 'My Budget +/- £150', 'My Budget +/- £200', 'My Budget +/- £250'], rent)
  populateDropdown('duration', ['Less Than 6 Months', '6 Months to a Year', '1 to 2 Years', 'Over 2 Years'], duration)
  populateDropdown('university_filter', universities, university)
  populateDropdown('city_filter', cities, selectedCity)
  populateDropdown('profession_filter', ['Student', 'Professional'], profession)
  populateDropdown('features', features, userFeatures, true) // Allows multiple selections for features.

  // Only populates preferences if age is defined, indicating an edit scenario.
  if (age) {
    populateDropdown('preferences', features, preferences, true)
  }

  // Initializes Select2 on each dropdown for enhanced usability.
  ['age_filter', 'rent_filter', 'duration', 'university_filter', 'city_filter', 'profession_filter'].forEach(id => {
    $(`#${id}`).select2({ minimumResultsForSearch: id === 'city_filter' || id === 'university_filter' ? undefined : -1 })
  })
}

// Helper function to add options to a dropdown.
function populateDropdown (id, options, selectedValue, isMultiple = false) {
  // Finds the select element by its ID.
  const select = document.getElementById(id)
  options.forEach(option => {
    const isSelected = isMultiple ? selectedValue?.includes(option) : option === selectedValue // Checks if the option was previously selected.
    const optionElement = new Option(option, option, isSelected, isSelected) // Creates a new option element.
    select.add(optionElement) // Adds the option to the select element.
  })
}

/**
 * Initializes functionality for resetting user preferences on the profile editing page.
 *
 * Key Functionalities:
 * - Provides a checkbox for users to confirm their intention to reset preferences.
 * - Enables or disables the preferences selection dropdown based on the checkbox state.
 * - Clears the selections in the preferences dropdown when it is disabled.
 *
 * How It Works:
 * - Attaches an event listener to the checkbox for the 'change' event.
 * - The preferences dropdown is initially disabled until the user checks the confirmation checkbox.
 * - If the checkbox is checked, the preferences dropdown is enabled, allowing users to select preferences.
 * - If the checkbox is unchecked, the preferences dropdown is disabled and cleared of any selections.
 *
 * External Dependencies:
 * - jQuery: Used for manipulating the DOM and handling events for simplicity and browser compatibility.
 *
 * Usage:
 * - To be used on user editing pages where users can reset their preferences.
 *
 */

/* global $ */

// Function to initialize the reset preferences functionality.
export const setupResetPreferences = () => {
  // Selects the checkbox element from the DOM.
  const confirmResetCheckbox = document.getElementById('confirm-reset')

  // Function to enable or disable the preferences dropdown and clear selections if disabled.
  const setPreferencesDisabled = (disabled) => {
    $('#preferences').prop('disabled', disabled) // Enables or disables the dropdown.
    if (disabled) {
      $('#preferences').val(null).trigger('change') // Clears selections when disabled.
    }
  }

  setPreferencesDisabled(true) // Initially disable the preferences select.

  // Adds an event listener for changes to the checkbox state.
  confirmResetCheckbox.addEventListener('change', () => {
    // Enables or disables the preferences dropdown based on the checkbox state.
    setPreferencesDisabled(!confirmResetCheckbox.checked)
  })
}

/**
 * Manages the behavior of the side navigation menu, including its toggle mechanism.
 *
 * Key Functionalities:
 * - Toggles the side navigation panel's visibility on hamburger menu click.
 * - Closes the side navigation panel when clicking outside of it.
 *
 * How It Works:
 * - Listens for clicks on the hamburger menu icon to toggle the side panel's width, thereby showing or hiding the panel.
 * - Listens for clicks outside of the hamburger menu and side panel to close the panel if it is open.
 *
 * External Dependencies:
 * - This module is dependent on the presence of specific HTML elements with IDs 'hamburger-menu' and 'side-panel'.
 *
 * Usage:
 * - Invoke `setupSideMenu()` on page load to initialize the side menu functionality.
 *
 */

// Initializes the side menu functionality.
export const setupSideMenu = () => {
  // Find the hamburger menu icon by its ID.
  const hamburger = document.getElementById('hamburger-menu')

  // Define a function to toggle the side panel's visibility.
  const toggleMenu = () => {
    const panel = document.getElementById('side-panel')
    // Toggle the width between 250px and 0 to show or hide the panel.
    panel.style.width = panel.style.width === '250px' ? '0' : '250px'
  }

  // Attach the toggle function to the hamburger menu's click event.
  hamburger.addEventListener('click', toggleMenu)

  // Close the side panel when clicking outside of it
  window.addEventListener('click', (event) => {
    // Check if the click is outside the hamburger menu and its children.
    if (!event.target.matches('.hamburger-menu, .hamburger-menu *')) {
      const panel = document.getElementById('side-panel')
      // If the panel is open (width 250px), close it.
      if (panel.style.width === '250px') {
        panel.style.width = '0'
      }
    }
  })
}

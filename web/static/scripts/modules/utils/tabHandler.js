/**
 * Manages tab switching functionality, allowing for the dynamic display of content based on the selected tab.
 *
 * Key Functionalities:
 * - Dynamically switches between tabs, showing the associated content while hiding others.
 * - Supports customization for activating tabs and managing visibility of their respective content areas.
 *
 * How It Works:
 * - Upon initialization, attaches click event listeners to each tab that trigger content display changes.
 * - Utilizes a class-based approach to add/remove 'active' or 'inactive' classes to tabs, controlling their appearance.
 * - Shows or hides content areas based on the selected tab, ensuring only the content for the active tab is visible.
 *
 * External Dependencies:
 * - Assumes the presence of HTML elements representing tabs and their respective content areas.
 *
 * Usage:
 * - Create an instance of TabHandler by passing arrays of tab elements and their corresponding content elements, along with a boolean indicating whether the first tab should be active by default.
 *
 */

// Class definition for managing tab functionality.
class TabHandler {
  // Constructor receives the tabs, contents, and an initial active state.
  constructor (tabs, contents, active) {
    this.tabs = tabs // Array of tab elements.
    this.contents = contents // Array of content elements corresponding to each tab.
    this.active = active // Determines the initial active state of tabs.
    this.initEvents() // Initialize event listeners.
  }

  // Sets up click event listeners for each tab.
  initEvents () {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        this.activateTab(index) // Activate the clicked tab.
      })
    })
  }

  // Activates the tab at the given index and updates content visibility.
  activateTab (activeIndex) {
    this.tabs.forEach((tab, index) => {
      // If this is the active tab, adjust classes and show content.
      if (index === activeIndex) {
        if (this.active) {
          tab.classList.add('active')
        } else {
          tab.classList.remove('inactive')
        }
        this.contents[index].style.display = 'block' // Show the associated content.
      } else {
        // For all other tabs, remove active class or add inactive class and hide content.
        if (this.active) {
          tab.classList.remove('active')
        } else {
          tab.classList.add('inactive')
        }
        this.contents[index].style.display = 'none' // Hide the content.
      }
    })
  }
}

export default TabHandler

/**
 * This script is dedicated to handling the display and management of users matches within the Redwood Prototype platform.
 * It integrates functionalities from various utility modules to enrich the user experience with interactive and dynamic content.
 * Users can chat with their matches, view the detials of their matches, remove their matches or report their matches.
 *
 * Dependencies:
 * - Firebase SDK : The script requires Firebase SDK to be included in the project as it uses Firebase Auth for Google Sign-In.
 * - Pikaday: A lightweight calendar library.
 *
 * Key Functionalities:
 * - Dynamically displays matches for the current user by fetching them from the server.
 * - Manages user interactions with the ability to chat to matches and reporting issues.
 * - Utilizes the 'setupSideMenu' module to enable responsive navigation.
 *
 * Event Listeners:
 * - 'DOMContentLoaded': Ensures that the script executes once the HTML document's content is fully loaded, setting up the necessary
 *   functionalities and fetching user matches.
 * - 'click': Listens for click events on the window to close contact modals when clicked outside, enhancing the modal interaction experience.
 *
 * Imported Modules:
 * - setupSideMenu: Manages interactions with the side navigation menu, ensuring responsive behavior and easy navigation of the site.
 * - displayMatches: Fetches and displays the matches for the current user, creating an interactive list of potential roommates.
 * - showReportModal: Sets up and displays a modal for reporting issues, providing users with a mechanism to report inappropriate behavior or content.
 *
 * This script acts as a bridge between the user interface and the server-side logic, ensuring that matches are displayed correctly and
 * that user interactions are handled efficiently.
 */

import { setupSideMenu } from '../modules/utils/sideMenu.js'
import { displayMatches } from '../modules/matches/matchUtilitySetup.js'
import { showReportModal } from '../modules/utils/modalDisplay.js'

document.addEventListener('DOMContentLoaded', () => {
  // FUnctionality to allow user to click out of chats with their matches by clicking anywhere outside of the chat box
  window.addEventListener('click', function (event) {
    const modals = document.querySelectorAll('.contact-modal')
    modals.forEach(function (modal) {
      if (event.target === modal) {
        modal.style.display = 'none'
      }
    })
  })
  // Initialize the side menu for easy navigation of the site.
  setupSideMenu()
  // Initialize the report modal functionality.
  showReportModal(undefined, true)
  // Populate the web page with match cards.
  displayMatches()
})

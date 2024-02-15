/**
 * The 'recommendations.js' script is central to the Redwood Prototype platform's recommendation system. It orchestrates the fetching,
 * display, and interaction with user recommendations, leveraging several utility modules to provide a comprehensive user experience.
 *
 * Dependencies:
 * - MapLibre: A JavaScript library for interactive maps, used to render the map and handle user interactions.
 * - Pikaday: A lightweight calendar library.
 * - Turf: A library allowing for geographical calculations.
 *
 * Key Functionalities:
 * - Initializes the user interface for recommendations, setting up tabs for budget and calendar views.
 * - Integrates with the MapManager to display geographical preferences and isochrone data.
 * - Utilizes the RecommendationHandler to fetch and manage recommendations, adapting to user interactions.
 *
 * Event Listeners:
 * - 'DOMContentLoaded': Guarantees the execution of setup logic after the complete loading of the document, ensuring all elements are
 *   accessible for manipulation and event binding.
 *
 * Imported Modules:
 * - setupSideMenu: Provides responsive navigation functionality through a side menu.
 * - RecommendationHandler: Manages the recommendation logic, including fetching, displaying, and updating recommendations based on user interactions.
 * - TabHandler: Manages the tab interactions within the recommendation view, allowing users to switch between budget and calendar or map and info views seamlessly.
 * - MapManager: Initializes and manages a map view, displaying geographical data relevant to the user's preferences.
 * - DatePicker: Integrates a calendar for viewing move-in dates, enhancing the user's ability to view recommendations availability.
 *
 * This script plays a pivotal role in the user's exploration of potential matches, utilizing advanced UI components and interaction patterns
 * to present recommendations in an engaging and intuitive manner.
 */

/* global latitude, longitude, isochroneData */

import { setupSideMenu } from '../modules/utils/sideMenu.js'
import { RecommendationHandler } from '../modules/recommendations/recommendationHandler.js'
import TabHandler from '../modules/utils/tabHandler.js'
import { MapManager } from '../modules/utils/map.js'
import { showReportModal } from '../modules/utils/modalDisplay.js'
import { DatePicker } from '../modules/utils/calendarHandler.js'

// Event listener to fetch recommendations when the DOM content is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  // Setup the viewing ability of the budget and calendar sections of the user profile (when one is active the other is not).
  const budgetCalendarTabs = [document.getElementById('budget-switch'), document.getElementById('calendar-switch')]
  const budgetCalendarContents = [document.querySelector('.budget-container'), document.querySelector('.calendar-container')]
  // Initialize the tab handler for the budget and calendar sections below.
  // eslint-disable-next-line no-new
  new TabHandler(budgetCalendarTabs, budgetCalendarContents, false)

  // Setup the viewing ability of the user info and isochrone sections of the user profile (when one is active the other is not).
  const infoMapTabs = [document.getElementById('userInfoTab'), document.getElementById('mapTab')]
  const infoMapContents = [document.getElementById('userInfoContent'), document.getElementById('map')]
  // Initialize the tab handler for the user info and isochrone sections below.
  // eslint-disable-next-line no-new
  new TabHandler(infoMapTabs, infoMapContents, true)
  // Initialize the map that will display the isochrones, start by displaying the users own isochrone before adding intersects.
  const mapManager = new MapManager('map', 'https://api.maptiler.com/maps/voyager/style.json?key=VdfOjWSRzQd0jJ7Q0LKj', [longitude, latitude], 7, isochroneData)
  mapManager.initMap()
  // Initialize the calendar instance to display recommendations move in dates.
  const datePickerInstance = new DatePicker()
  // Initialize the side menu for easy navigation of the site.
  setupSideMenu()
  // Initialize recommendation handling and load initial data
  const recommendationHandler = new RecommendationHandler(mapManager, datePickerInstance)
  recommendationHandler.checkAndLoadRecommendations()
  // Initialize the report modal functionality.
  showReportModal(recommendationHandler, false)
})

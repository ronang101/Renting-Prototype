/**
 * Provides a calendar view for viewing move in dates within a specified range.
 * Utilizes Pikaday, a lightweight JavaScript date picker / calendar library.
 *
 * Key Functionalities:
 * - Dynamically initializes and manages Pikaday date pickers for the application.
 * - Customizes the calendar view to highlight specific dates and disable selection.
 *
 * How It Works:
 * - The DatePicker class manages a Pikaday instance, configuring it according to the application's needs.
 * - `initializePikadayForMatch` function creates a Pikaday instance for each match card, highlighting available dates.
 *
 * External Dependencies:
 * - Pikaday: A date picker library. It must be included in the project for this module to work.
 *
 * Usage:
 * - Instantiate the `DatePicker` class to create a main calendar view.
 * - Use `initializePikadayForMatch` to create calendar instances for individual matches with custom date ranges.
 *
 */

/* global Pikaday */

// Class to manage Pikaday date pickers with customized behavior and styling.
export class DatePicker {
  constructor () {
    this.startDate = new Date(2024, 0, 1) // Default start date.
    this.endDate = new Date(2025, 11, 31) // Default end date.
    if (document.getElementById('calendar')) {
      this.pikaday = this.initPikaday() // Initialize Pikaday if 'calendar' element exists.
    }
  }

  // Initializes a Pikaday instance with custom configurations.
  initPikaday () {
    return new Pikaday({
      field: document.createElement('input'), // Dummy input for initialization.
      bound: false, // Unbinds the calendar from the dummy input field.
      container: document.getElementById('calendar'), // Specifies the container for the calendar.
      maxDate: new Date(2025, 11, 31), // Minimum date that can be viewed and selected.
      minDate: new Date(2024, 0, 1), // Maximum date that can be viewed and selected.
      onDraw: () => {
        // Custom logic to be executed when the calendar is drawn.
        // This function gets called whenever the calendar is drawn/re-drawn.
        const dates = document.querySelectorAll('.pika-button') // Selects all date elements in the calendar.
        dates.forEach(date => {
          // Logic to highlight dates within a specific range and disable pointer events.
          const dateObj = new Date(date.getAttribute('data-pika-year'), date.getAttribute('data-pika-month'), date.getAttribute('data-pika-day'))
          // If the dateObj is within the range, add a class to highlight it.
          if (dateObj >= this.startDate && dateObj <= this.endDate) {
            date.classList.add('highlighted') // Highlight date.
          }
          date.style.pointerEvents = 'none' // Disable selection.
        })
      }
    })
  }

  // Updates the calendar with new start and end dates, then redraws it.
  updateDates (startDate, endDate) {
    this.startDate = startDate
    this.endDate = endDate
    this.pikaday.gotoDate(this.startDate) // Navigate to start date.
    this.pikaday.draw() // Redraw to apply changes.
  }
}

// Initializes the Pikaday calendar for a specific match card.
// Sets the calendar's maximum and minimum dates and customizes its appearance and behavior.
export function initializePikadayForMatch (match, index) {
  // Extract start and end dates from match data.
  const startDate = new Date(match.moving_filter[0])
  const endDate = new Date(match.moving_filter[1])
  const container = document.getElementById(`calendar-${index}`) // Get the specific calendar container for the match.

  // Initialize Pikaday with custom settings for this match.
  const pikaday = new Pikaday({
    field: document.createElement('input'), // Dummy input for initialization.
    bound: false, // Unbinds the calendar from the dummy input field.
    container, // Specifies the container for the calendar.
    maxDate: new Date(2025, 11, 31), // Minimum date that can be viewed and selected.
    minDate: new Date(2024, 0, 1), // Maximum date that can be viewed and selected.
    onDraw: () => {
      // Custom logic to be executed when the calendar is drawn.
      // This function gets called whenever the calendar is drawn/re-drawn.
      const dates = container.querySelectorAll('.pika-button') // Selects all date elements in the calendar.
      dates.forEach(function (date) {
        // Logic to highlight dates within a specific range and disable pointer events.
        const dateObj = new Date(date.getAttribute('data-pika-year'), date.getAttribute('data-pika-month'), date.getAttribute('data-pika-day'))
        // If the dateObj is within the range, add a class to highlight it.
        if (dateObj >= startDate && dateObj <= endDate) {
          date.classList.add('highlighted') // Highlight date.
        }
        date.style.pointerEvents = 'none' // Disable selection.
      })
    }
  })
  pikaday.draw() // Draw the calendar initially.
  pikaday.gotoDate(startDate) // Navigate to start date.
}

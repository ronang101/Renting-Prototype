/**
 * Handles modal functionalities for mutual interests and user reporting within the application.
 *
 * Key Functionalities:
 * - Displaying a modal when there's a mutual interest between users.
 * - Providing UI for reporting users and handling form submission.
 * - Show a "thank you" message after a report is submitted.
 *
 * How It Works:
 * - Utilizes document.getElementById and other DOM manipulation methods to interact with modal elements.
 * - Attaches event listeners to modal close buttons and the form submission event to handle user interactions.
 *
 * External Dependencies:
 * - This module relies on the `api.js` and `recommendationApi.js` for backend API communication.
 *
 * Usage:
 * - `showModal(recName)` is called when a mutual like is detected to inform users of a match.
 * - `showReportModal(recommendationHandler, matchReport)` sets up the reporting modal, handling both general and match-specific reports.
 *
 */

import { reportMatch } from './api.js'
import { report } from './recommendationApi.js'
import { checkIfMatchesLeft } from '../matches/matchUtilitySetup.js'

// Displays a modal when there's a mutual like between users.
// Provides functionality to close the modal through various UI elements.

export function showModal (recName) {
  const modal = document.getElementById('mutualInterestModal') // Access the mutual interest modal element.
  const span = document.getElementsByClassName('close')[0] // Access the close button of the modal.
  modal.style.display = 'flex' // Make the modal visible
  const matchText = modal.querySelector('.modal-body .match-text')
  matchText.textContent = `You and ${recName} have liked each other.` // Customize the modal text with the matched user's name.
  const closeButton = modal.querySelector('.modal-close-btn')

  // Closed modal when clicking on the modal or on close button.
  span.onclick = () => {
    modal.style.display = 'none' // Close the modal when the 'x' button is clicked.
  }
  closeButton.onclick = () => {
    modal.style.display = 'none' // Close the modal when the close button is clicked.
  }

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none' // Close the modal if the user clicks outside of it.
    }
  }
}

// Sets up and handles the UI for reporting a user.
// Includes form submission handling and displaying a thank you modal after submission.

export function showReportModal (recommendationHandler = undefined, matchReport = false) {
  const reportModal = document.getElementById('report-modal') // Access the report modal element.
  const ReportClose = document.getElementsByClassName('report-close')[0] // Access the close button of the report modal.
  const thankYouModal = document.getElementById('thank-modal') // Access the "thank you" modal element.

  // Close the "thank you" modal action.
  document.getElementById('thank-you-close-btn').onclick = () => {
    thankYouModal.style.display = 'none'
  }

  // Display the report modal when the report button is clicked.
  if (!matchReport) {
    const reportBtn = document.getElementById('report-btn')
    reportBtn.onclick = () => {
      reportModal.style.display = 'flex'
    }
  }

  // Close report modal actions.
  ReportClose.onclick = () => {
    reportModal.style.display = 'none'
  }

  // Close the modal if the user clicks outside of it.
  window.onclick = function (event) {
    if (event.target === reportModal) {
      reportModal.style.display = 'none'
    }
    if (event.target === thankYouModal) {
      thankYouModal.style.display = 'none'
    }
  }

  // Handle report form submission.
  const form = document.getElementById('report-form')
  form.onsubmit = function (e) {
    e.preventDefault() // Prevents the default form submission action. (No refreshing)
    const formData = new FormData(form) // Gathers the form data for submission.
    reportModal.style.display = 'none' // Hides the report modal after submission.

    if (matchReport) {
      // If reporting a match, hide the reported match and submit a match report.
      const reportedCardId = `match-card-${form.reportedUserId.value}`
      const reportedCard = document.getElementById(reportedCardId)
      reportedCard.style.display = 'none' // Hides the reported user.
      reportMatch(formData) // Calls the API to handle the match report submission.
    } else {
      // General report behavior.
      report(formData) // Calls the API to handle the general report submission.
      recommendationHandler.loadNextRecommendation()
    }

    thankYouModal.style.display = 'flex' // Displays a 'thank you' modal post submission.

    if (matchReport) {
      checkIfMatchesLeft() // Check if there are any matches left to display.
    }
  }
}

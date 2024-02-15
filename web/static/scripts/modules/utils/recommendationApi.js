/**
 * Manages communication with the backend API for fetching recommendations,
 * checking recommendations, recording user interactions, and sending user reports.
 *
 * Key Functionalities:
 * - Fetching new recommendations based on user's seen IDs and interactions.
 * - Checking for stored recommendations to avoid recalculations.
 * - Recording user interactions (like, dislike, superlike) with recommendations.
 * - Sending user reports to the server for inappropriate content or behavior.
 *
 * How It Works:
 * - Utilizes the fetch API for sending requests to the server with appropriate headers and body content.
 * - Processes and checks the response from the server to handle success or failure.
 *
 * External Dependencies:
 * - None. This module relies on the native fetch API available in modern browsers.
 *
 * Usage:
 * - `fetchRecommendationsApi(seenUserIds, interactions)` fetches new recommendations based on seen IDs and user interactions.
 * - `checkRecommendations()` checks for existing recommendations to reduce server load.
 * - `recordInteraction(recommendationId, interactionType)` records the user's interaction with a recommendation.
 * - `report(formData)` sends a user report to the server with the details of the complaint.
 *
 */

// Function to fetch recommendations from the server.
export function fetchRecommendationsApi (seenUserIds, interactions) {
  const requestData = { seenUserIds, interactions }
  // API request to fetch recommendations.
  return fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  }).then(response => {
    // Check for successful response.
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
}

// Checks for existing recommendations to potentially avoid unnecessary calculations.
export function checkRecommendations () {
  // API request to check for recommendations.
  return fetch('/api/check_recommendations', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).then(response => {
    // Check for successful response.
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
}

// Records a user's interaction with a recommendation (like, dislike, etc.).
export function recordInteraction (recommendationId, interactionType) {
  // API request to record the interaction.
  return fetch('/record_interaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId, interactionType })
  }).then(response => {
    // Check for successful response.
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
}

// Function to send a report to the server.
export function report (formData) {
  const reportData = Object.fromEntries(formData.entries())
  // API request to send report.
  fetch('/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  })
    .then(response => {
      // Check for successful response.
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
    })
    .catch(error => console.error('Error submitting report:', error))
}

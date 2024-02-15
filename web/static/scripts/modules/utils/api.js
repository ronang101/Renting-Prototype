/**
 * Provides utility functions for communicating with the server to fetch matches,
 * report matches, remove matches, and fetch profile images.
 *
 * Key Functionalities:
 * - Fetching matches from the server.
 * - Reporting a match with detailed information.
 * - Removing a match based on its ID.
 * - Fetching a presigned URL for a profile image.
 *
 * How It Works:
 * Each function makes an HTTP request to specific endpoints on the server, handling
 * the request and response cycle to perform actions or retrieve data. Error handling is
 * implemented to catch and log any issues encountered during these requests.
 *
 * External Dependencies:
 * None explicitly, but relies on the Fetch API provided by modern web browsers for making HTTP requests.
 *
 * Usage:
 * - `fetchMatches()` to retrieve an array of match data.
 * - `reportMatch(formData)` to send a report about a match, where formData is FormData object containing report details.
 * - `removeMatch(id)` to delete a match by its unique ID.
 * - `getImage(id)` to get a presigned URL for a user's profile image by their unique ID.
 *
 */

// Fetches matches from the server and returns a promise with the match data.
export function fetchMatches () {
  // API request to fetch matches.
  return fetch('/api/matches', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => {
      // Check for successful response.
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
}

// Sends a report for a match to the server using form data.
export function reportMatch (formData) {
  const reportData = Object.fromEntries(formData.entries())
  // API request to send report.
  fetch('/report_match', {
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

// Function to remove a match from the server.
export function removeMatch (id) {
  // API request to remove match.
  fetch('/remove_match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
    })
    .catch(error => console.error('Error submitting report:', error))
}

// Fetches a presigned URL for a user's profile image by ID.
export function getImage (id) {
  return fetch(`/images/${id}`).then(response => {
    if (response.ok) {
      return response.url // The response URL is the presigned URL.
    } else {
      throw new Error('Could not fetch the image.')
    }
  })
}

/**
 * The setupIsochroneInput function initializes an interactive map for users to specify their location and preferred transportation mode for isochrone analysis within the Redwood Prototype. This feature aids in defining a user's search area based on travel time from a selected point.
 *
 * Key Functionalities:
 * - Initializes an interactive map using Maplibre GL, centered on the user's current location or a default location.
 * - Allows users to place a marker by clicking on the map, indicating their preferred starting location for isochrone analysis.
 * - Supports selecting transportation modes (e.g., driving, walking) to tailor the isochrone results according to the user's preferences.
 * - Updates hidden form fields with the selected location's latitude and longitude, and the chosen transportation mode for backend processing.
 *
 * How It Works:
 * - Upon invocation, the function creates a new map instance with predefined settings, including the map style and initial zoom level.
 * - A marker is placed at the specified or default location, which can be moved by the user to adjust the starting point for the isochrone calculation.
 * - Listeners on map click events allow users to relocate the marker, updating the corresponding form fields with the new coordinates.
 * - Transportation mode buttons enable users to select their preferred mode of travel, affecting the isochrone's shape and reach.
 *
 * External Dependencies:
 * - Maplibre GL (maplibregl): A JavaScript library for interactive maps, used to render the map and handle user interactions.
 * - Maptiler: Provides the map style used in the map instance, requiring an API key for access.
 *
 * Usage:
 * - This function is typically called during page initialization where the user can input their location and preferences related to housing searches.
 * - It enhances the user interface by providing a visual and interactive way to define search parameters related to geographical location and accessibility.
 *
 * Initializes the map centered on London, with 'drive' as the default transportation mode.
 */

/* global maplibregl */

export const setupIsochroneInput = (userLongitude = -0.1278, userLatitude = 51.5074, userTransportMode = 'drive', userTravelTime = undefined) => {
  const map = new maplibregl.Map({
    container: 'map', // ID of the container where the map will be rendered.
    style: 'https://api.maptiler.com/maps/voyager/style.json?key=VdfOjWSRzQd0jJ7Q0LKj', // Map style URL with API key.
    center: [userLongitude, userLatitude], // Use user's location as the center (or default as London).
    zoom: 8 // Adjusted zoom level.
  })

  const marker = new maplibregl.Marker().setLngLat([userLongitude, userLatitude]).addTo(map) // Place the marker at user's location immediately.

  // Add click event to place a marker and get lat/long.
  map.on('click', function (e) {
    const { lng: longitude, lat: latitude } = e.lngLat // Get the longitude and latitude of the clicked location.

    // Update hidden form fields for latitude and longitude.
    document.getElementById('latitude').value = latitude
    document.getElementById('longitude').value = longitude

    // Move the marker to the clicked location.
    marker.setLngLat([longitude, latitude])
  })

  // Handle transportation mode selection and initialization.
  const transportButtons = document.querySelectorAll('.transport-btn')
  // Loop through each transport button to add functionality.
  transportButtons.forEach(btn => {
    const mode = btn.getAttribute('data-mode')
    if (mode === userTransportMode) {
      btn.classList.add('selected')
    }
    // Add click event listener to each transport button for selection.
    btn.addEventListener('click', function () {
      // Remove 'selected' class from all buttons.
      transportButtons.forEach(button => button.classList.remove('selected'))
      // Add 'selected' class to the clicked button.
      this.classList.add('selected')
      // Update the hidden form field with the selected transportation mode.
      document.getElementById('transportation_method').value = mode
    })
  })

  if (userTravelTime) {
    // Set the user's travel time in the form field.
    document.getElementById('travel_time').value = userTravelTime
  }
}

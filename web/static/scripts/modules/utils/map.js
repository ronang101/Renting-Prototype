/**
 * Manages map functionalities, including initialization and displaying isochrones.
 *
 * Key Functionalities:
 * - Initializes a map using maplibre-gl with custom styles and centering.
 * - Displays isochrone data on the map to visualize areas reachable within a certain time frame.
 * - Updates the map to show intersections between user-defined areas and isochrones.
 *
 * How It Works:
 * - The MapManager class encapsulates methods for map initialization, displaying isochrones, and updating intersections.
 * - Utilizes maplibre-gl for map rendering and Turf.js for geographical calculations.
 *
 * External Dependencies:
 * - maplibre-gl: An open-source library for embedding interactive maps.
 * - Turf.js: A JavaScript library for spatial analysis, used here for calculating intersections.
 *
 * Usage:
 * - Instantiate the `MapManager` with the ID of the map container, map style URL, initial center coordinates, zoom level, and isochrone data.
 * - Call `initMap` to initialize and render the map.
 * - Use `displayIsochrones` to add isochrone data to the map.
 * - Use `updateIntersection` to show the intersection of user-defined geographical areas and the isochrones.
 *
 */

/* global maplibregl, turf */

// Class to manage map functionalities, including displaying isochrones and intersections.
export class MapManager {
  constructor (containerId, style, center, zoom, isochroneData) {
    // Map configuration parameters.
    this.map = null // Will hold the map instance.
    this.containerId = containerId // ID of the HTML element to host the map.
    this.style = style // URL of the map style.
    this.center = center // Initial center of the map [longitude, latitude].
    this.zoom = zoom // Initial zoom level.
    this.isochroneData = isochroneData // GeoJSON data for isochrones.
  }

  // Initializes the map with the provided settings.
  initMap () {
    this.map = new maplibregl.Map({
      container: this.containerId,
      style: this.style,
      center: this.center,
      zoom: this.zoom
    })

    // Once the map is loaded, display the isochrones.
    this.map.on('load', () => {
      this.displayIsochrones(this.isochroneData) // Display isochrones on map load.
    })
  }

  // Display isochrone data on the map.
  displayIsochrones (isochroneData) {
    if (!this.map.getSource('isochrone')) { // Check if the source already exists.
      this.map.addSource('isochrone', { // Add a new source for isochrone data.
        type: 'geojson',
        data: isochroneData
      })

      this.map.addLayer({ // Add a new layer to visualize the isochrone data.
        id: 'isochrone',
        type: 'fill',
        source: 'isochrone',
        layout: {},
        paint: {
          'fill-color': '#888', // Set the fill color.
          'fill-opacity': 0.3 // Set the fill opacity.
        }
      })
    }
  }

  // Updates the map to display the intersection between isochrone data and user-defined areas.
  updateIntersection (recGeoData) {
    // Calculate the intersection using Turf.js.
    const intersection = turf.intersect(this.isochroneData.features[0], recGeoData.features[0])

    if (intersection) { // If there is an intersection.
      if (this.map.getSource('isochrone-intersection')) { // Check if the source exists.
        this.map.getSource('isochrone-intersection').setData(intersection)// Update the data.
      } else { // If the source doesn't exist, create a new one.
        this.map.addSource('isochrone-intersection', {
          type: 'geojson',
          data: intersection
        })

        this.map.addLayer({ // Add a new layer for the intersection.
          id: 'isochrone-intersection',
          type: 'fill',
          source: 'isochrone-intersection',
          paint: {
            'fill-color': '#888', // Set the fill color for the intersection.
            'fill-opacity': 0.75 // Set the fill opacity for the intersection.
          }
        })
      }
    } else { // If there is no intersection.
      if (this.map.getLayer('isochrone-intersection')) {
        this.map.removeLayer('isochrone-intersection') // Remove the intersection layer.
      }
      if (this.map.getSource('isochrone-intersection')) {
        this.map.removeSource('isochrone-intersection') // Remove the intersection source.
      }
    }
  }
}

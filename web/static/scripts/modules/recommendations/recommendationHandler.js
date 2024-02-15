/**
 * The RecommendationHandler class is a central component of the Redwood Prototype, managing the recommendation system's frontend logic. This class handles fetching, displaying, and interacting with user recommendations, leveraging various APIs and UI components to create a dynamic and personalized user experience.
 *
 * Key Functionalities:
 * - Dynamically fetches and displays user recommendations based on previously seen user IDs and interaction history.
 * - Records user interactions with recommendations (like, dislike, superlike) and updates the recommendation list accordingly.
 * - Manages the display of user features categorized into About Me, Lifestyle, and Interests, enhancing the user's understanding of potential matches.
 * - Utilizes external components such as MapManager for displaying geographical data and DatePicker for handling date selections related to user availability.
 *
 * How It Works:
 * - Upon initialization, the RecommendationHandler sets up the necessary state for managing recommendations, including indexes and arrays for tracking seen recommendations and user interactions.
 * - It provides methods for loading next recommendations, fetching recommendations from the API, and recording user interactions with recommendations.
 * - The class integrates with MapManager and DatePicker instances for handling map-based and date-based features of recommendations.
 * - Interaction buttons (like, dislike, superlike) are dynamically enabled or disabled based on the current state to ensure appropriate loads.
 *
 * External Dependencies:
 * - `../utils/recommendationApi.js`: For API calls to fetch recommendations and record interactions.
 * - `../utils/modalDisplay.js`: For displaying modals related to mutual interests and reporting.
 * - `../utils/api.js`: For fetching images associated with recommendations.
 * - `../variables/features.js`: Contains mappings of user features to categories (About Me, Lifestyle, Interests) for display purposes.
 *
 * Usage:
 * - Instantiate RecommendationHandler within the context of the page where user recommendations are displayed.
 * - Utilize its methods to manage the recommendation lifecycle, from fetching and displaying to recording interactions.
 * - Leverage the integrated MapManager and DatePicker instances for enhanced feature display and interaction capabilities.
 */

import { fetchRecommendationsApi, recordInteraction, checkRecommendations } from '../utils/recommendationApi.js'
import { showModal } from '../utils/modalDisplay.js'
import { getImage } from '../utils/api.js'
import { aboutMe, lifestyle, interests } from '../variables/features.js'

export class RecommendationHandler {
  constructor (mapManager, datePickerInstance) {
    this.currentRecIndex = 0
    this.recommendations = []
    this.seenUserIds = []
    this.interactions = JSON.parse(localStorage.getItem('userInteractions')) || []
    this.fetching = false
    this.mapManager = mapManager
    this.datePickerInstance = datePickerInstance
  }

  // Function to load the next recommendation.
  loadNextRecommendation () {
    if (this.recommendations.length > 0) {
      // Check if there are more recommendations to display.
      if (this.currentRecIndex < this.recommendations.length) {
        // Get the current recommendation and display it.
        const rec = this.recommendations[this.currentRecIndex]
        this.seenUserIds.push(rec.id)
        this.displayRecommendation(rec)
        // Load new recommendations before running out of current recommendations for better load times. The == 30 prevents a loop from occuring.
        if (this.currentRecIndex === this.recommendations.length - 1 && this.recommendations.length === 30) {
          this.fetchRecommendationsEarly()
        }
        // Move to next recommendation.
        this.currentRecIndex++
      } else {
        // If no more recommendations, fetch new ones.
        this.fetchRecommendations()
      }
    } else {
      // No recommendations available, hide the recommendation container and show the message.
      document.getElementById('recommendation-container').style.display = 'none'
      document.getElementById('no-recommendation-container').style.display = 'block'
    }
  }

  // Function to fetch recommendations from the server and display the next user.
  fetchRecommendations () {
    // Disable interaction buttons while fetching to prevent server overload.
    this.fetching = true
    this.disableInteractionButtons()
    // API call to fetch recommendations based on seen user IDs and interactions.
    fetchRecommendationsApi(this.seenUserIds, this.interactions)
      .then(data => {
        // Update the recommendations list and reset the index and interactions.
        this.recommendations = data
        this.currentRecIndex = 0
        this.interactions = []
        localStorage.setItem('userInteractions', JSON.stringify(this.interactions))
        this.loadNextRecommendation()
      })
      .catch(error => console.error('Failed to fetch recommendations.', error))
      .finally(() => {
        // Re-enable interaction buttons
        this.fetching = false
        this.enableInteractionButtons()
      })
  }

  // Function to fetch recommendations from the server without displaying the next user.
  fetchRecommendationsEarly () {
    if (this.fetching) return // Prevent concurrent fetches.
    this.fetching = true
    this.disableInteractionButtons()
    // API call to fetch recommendations based on seen user IDs and interactions.
    fetchRecommendationsApi(this.seenUserIds, this.interactions)
      .then(data => {
        // Update the recommendations list and reset the index and interactions.
        this.recommendations = data
        this.currentRecIndex = 0
        this.interactions = []
        localStorage.setItem('userInteractions', JSON.stringify(this.interactions))
      })
      .catch(error => console.error('Failed to fetch recommendations early.', error))
      .finally(() => {
        // Re-enable interaction buttons.
        this.fetching = false
        this.enableInteractionButtons()
      })
  }

  // Function to record user interaction with a recommendation.
  recordInteraction (recommendationId, recName, interactionType) {
    this.disableInteractionButtons() // Prevent overloading.
    // Push the interaction data to the interactions array.
    this.interactions.push({ recommendationId, interactionType })
    localStorage.setItem('userInteractions', JSON.stringify(this.interactions))
    // API call to record the interaction on the server.
    recordInteraction(recommendationId, interactionType)
      .then(data => {
        if (data.match) {
          showModal(recName)
        }
        this.loadNextRecommendation()
      })
      .catch(error => console.error('Error recording interaction:', error))
      .finally(() => {
        // Re-enable interaction buttons.
        this.enableInteractionButtons()
      })
  }

  // Function to disable interaction buttons.
  disableInteractionButtons () {
    document.querySelectorAll('.like-btn, .dislike-btn, .superlike-btn').forEach(button => {
      button.disabled = true
    })
  }

  // Function to enable interaction buttons.
  enableInteractionButtons () {
    document.querySelectorAll('.like-btn, .dislike-btn, .superlike-btn').forEach(button => {
      button.disabled = false
    })
  }

  // Function to check for any pre-exisiting recommendations in order to avoid re-generating.
  checkAndLoadRecommendations () {
    checkRecommendations().then(data => {
      // Update the recommendations list.
      this.recommendations = data
      if (this.recommendations.length === 0) {
        this.fetchRecommendations()
      } else {
        this.loadNextRecommendation()
      }
    })
  }

  // Function used to display the current recommendation by dynamically updating the website to show the users information.
  displayRecommendation (rec) {
    // Decide which features belong in which category.
    this.displayFeaturesByCategory(rec)
    // Update rec.rent_filter[0] to be the max between its current value and 500.
    rec.rent_filter[0] = Math.max(rec.rent_filter[0], 500)

    // Update rec.rent_filter[1] to be the min between its current value and 2000.
    rec.rent_filter[1] = Math.min(rec.rent_filter[1], 2000)
    // Create the budget wheel based on the correct svg formatting.
    const budgetGaugeRotation = ((rec.rent_filter[0] - 500) * 360 / 2000) - 135
    const budgetGauge = 75.3975 * (rec.rent_filter[1] - rec.rent_filter[0]) / 1500
    const budgetGaugeInvis = 75.3975 - budgetGauge

    // Get place holder profile picture
    const placeholderImageUrl = '/static/images/vecteezy_default-profile-account-unknown-icon-black-silhouette_20765399.jpg'

    // Setting much of the HTML content for the recommendation.
    document.getElementById('rec-name').textContent = `${rec.name}`
    document.getElementById('rec-age').textContent = `${rec.age}`
    document.getElementById('rec-city').textContent = `${rec.city}`
    document.getElementById('bio-container').textContent = `${rec.bio}`
    document.getElementById('rec-uni').textContent = `${rec.university}`
    document.getElementById('rec-prof').textContent = `${rec.profession}`
    document.getElementById('rec-duration').textContent = `${rec.duration}`
    document.getElementById('reportedUserId').value = rec.id

    // Update Profile Image
    const profileImage = document.getElementById('profile-img')
    getImage(rec.id).then(presignedUrl => {
      profileImage.src = presignedUrl
    })
      .catch(error => {
        console.error('Failed to load profile image:', error)
        // Fallback to placeholder if the image fails to load.
        profileImage.src = placeholderImageUrl
      })

    // Update Budget Limits
    document.getElementById('lower-limit').textContent = `£${rec.rent_filter[0]}`
    document.getElementById('upper-limit').textContent = `£${rec.rent_filter[1]}`

    // Update the budget gauge based on the math completed above.
    const gaugeBg = document.getElementById('gauge-bg')
    gaugeBg.setAttribute('stroke-dasharray', `${budgetGauge}, ${budgetGaugeInvis}`)
    gaugeBg.setAttribute('transform', `rotate(${budgetGaugeRotation} 18 18)`)

    // Set up interaction buttons to be associated with given recommendation.
    document.getElementById('like-btn').onclick = () => {
      this.recordInteraction(rec.id, rec.name, 'liked')
    }
    document.getElementById('dislike-btn').onclick = () => {
      this.recordInteraction(rec.id, rec.name, 'disliked')
    }
    document.getElementById('superlike-btn').onclick = () => {
      this.recordInteraction(rec.id, rec.name, 'superliked')
    }

    // Create the pikaday calendar start and end dates.
    // eslint-disable-next-line no-global-assign
    const startDate = new Date(rec.moving_filter[0])
    // eslint-disable-next-line no-global-assign
    const endDate = new Date(rec.moving_filter[1])

    this.datePickerInstance.updateDates(startDate, endDate)
    this.mapManager.updateIntersection(rec.geo)
  }

  // Dynamically displays user features in specific categories on the UI.
  displayFeaturesByCategory (rec) {
    const aboutMeContainer = document.getElementById('about-me-container')
    const lifestyleContainer = document.getElementById('lifestyle-container')
    const interestsContainer = document.getElementById('interests-container')

    aboutMeContainer.innerHTML = ''
    lifestyleContainer.innerHTML = ''
    interestsContainer.innerHTML = ''

    // Decide which feature falls into which category and set the html for the given category.
    for (const feature of Object.keys(rec.features)) {
      const featureElement = `<span class="feature-bubble">${feature}</span>`
      if (aboutMe[feature]) {
        aboutMeContainer.innerHTML += featureElement
      } else if (lifestyle[feature]) {
        lifestyleContainer.innerHTML += featureElement
      } else if (interests[feature]) {
        interestsContainer.innerHTML += featureElement
      }
    }
  }
}

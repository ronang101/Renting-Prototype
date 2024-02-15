/**
 * This script is responsible for generating the HTML content for match cards within the Redwood Prototype platform. It uses predefined feature categories to organize and display user information in an intuitive and engaging manner.
 *
 * Key Functionalities:
 * - Dynamically creates match cards based on user data, incorporating elements such as profile pictures, bios, and personalized user features.
 * - Categorizes user features into About Me, Lifestyle, and Interests sections to provide a comprehensive view of each match.
 * - Implements budget gauges to visually represent a user's monthly rent budget, enhancing the match card's informational value.
 * - Utilizes placeholder images for user profiles to maintain a consistent visual aesthetic across match cards.
 *
 * How It Works:
 * 1. The function 'createMatchCard' accepts a match object and its index as parameters. The match object contains detailed information about a user, including their features, preferences, and budget range.
 * 2. User features are categorized and displayed within designated sections of the match card, providing a snapshot of the user's personality, lifestyle, and interests.
 * 3. The budget range is visualized through a custom SVG gauge, offering a quick glance at the user's financial considerations for renting.
 * 4. The match card's HTML structure is dynamically constructed and returned as a string, ready to be injected into the DOM.
 *
 * External Dependencies:
 * - The script relies on '../variables/features.js' to categorize user features accurately.
 *
 * Usage:
 * - This script is utilized by the matches display component to generate individual match cards as part of the user's browsing experience.
 * - It enhances the platform's ability to present matches in a detailed and user-friendly format, facilitating informed decisions about potential roommates.
 */

import { aboutMe, lifestyle, interests } from '../variables/features.js'
// Construct HTML content for a single match card.
// Includes profile picture, bio, and other user information.
// Sets up budget gauges and initializes feature sections like About Me, Lifestyle, Interests.
// Returns the constructed HTML string for the match card.
export function createMatchCard (match, index) {
  let aboutMeinnerHTML = ''
  let lifestyleinnerHTML = ''
  let interestsinnerHTML = ''
  // Decide which feature falls into which category and set the html for the given category.
  for (const feature of Object.keys(match.features)) {
    const featureElement = `<span class="feature-bubble">${feature}</span>`
    if (aboutMe[feature]) {
      aboutMeinnerHTML += featureElement
    } else if (lifestyle[feature]) {
      lifestyleinnerHTML += featureElement
    } else if (interests[feature]) {
      interestsinnerHTML += featureElement
    }
  }
  // Update match.rent_filter[0] to be the max between its current value and 500.
  match.rent_filter[0] = Math.max(match.rent_filter[0], 500)

  // Update match.rent_filter[1] to be the min between its current value and 2000.
  match.rent_filter[1] = Math.min(match.rent_filter[1], 2000)
  // Create the budget wheel based on the correct svg formatting.
  const budgetGaugeRotation = ((match.rent_filter[0] - 500) * 360 / 2000) - 135
  const budgetGauge = 75.3975 * (match.rent_filter[1] - match.rent_filter[0]) / 1500
  const budgetGaugeInvis = 75.3975 - budgetGauge

  // Get place holder profile picture.
  const placeholderImageUrl = '/static/images/vecteezy_default-profile-account-unknown-icon-black-silhouette_20765399.jpg'

  // Populate the html for the match card given the users information.
  return `
            <div class="recommendation" id="match-card-${match.id}">
                <button id="report-btn-${index}" class="report-btn" data-userid="${match.id}">
                    <i id = "circle-ex" class="fa fa-exclamation-circle" aria-hidden="true"></i>
                </button>       
            
                <h2 id="rec-name" >${match.name}</h2>
                <h3 id="rec-city" >${match.city}</h3>
                <div class="profile-picture">
                    <img  id="profile-img-${match.id}" src="${placeholderImageUrl}" alt="Profile Image">
                </div>
                <div class="important-information-sections">
                    <div class="bio">
                        <h2 class="bio-title">Bio</h2>
                        <p class="bio-container" id="bio-container">
                            ${match.bio}
                        </p>
                    </div>
                    <div class="extra-information-container">
                    <div class="info-container age-container">
                        <i class="fas fa-birthday-cake"></i>
                        <span>Age</span>
                        <p id = "rec-age">${match.age}</p>
                    </div>
                    <div class="info-container university-container">
                        <i class="fas fa-university"></i>
                        <span>University</span>
                        <p id = "rec-uni">${match.university}</p>
                    </div>
                    <div class="info-container occupation-container">
                        <i class="fas fa-briefcase"></i>
                        <span>Occupation</span>
                        <p id = "rec-prof">${match.profession}</p>
                    </div>
                    <div class="info-container duration-container">
                        <i class="fas fa-clock"></i>
                        <span>Duration</span> 
                        <p id = "rec-duration">${match.duration}</p>
                    </div>
                </div>
                    <div class="budget-calendar-flex"> 
                        <div class="budget-container" id="budget-container-${index}">
                            <h2 class="budget-title">Monthly Budget</h2>
                            <div class="budget-limits">
                                <div class="budget-label-low">
                                    <span class="budget-label">Minimum</span>
                                    <span id="lower-limit">£${match.rent_filter[0]}</span>
                                </div>
                                <div class="budget-gauge">
                                    <svg viewBox="0 0 36 36" class="circular-chart"> 
                                        <!-- Arc -->
                                        <path class="circle"

                                        fill="none" 
                                        transform="rotate(-135 18 18)"
                                        d="M18 2
                                            a 16 16 0 1 1 -16 16"
                                        />
                                        <path id="gauge-bg" class="circle-bg"

                                        fill="none" 
                                        stroke-dasharray = "${budgetGauge},${budgetGaugeInvis}"
                                        transform="rotate(${budgetGaugeRotation} 18 18)"

                                        d="M18 2
                                            a 16 16 0 1 1 -16 16"
                                    />
                                    </svg>
                                </div>
                                <div class="budget-label-up">
                                    <span class="budget-label">Maximum</span>
                                    <span id="upper-limit">£${match.rent_filter[1]}</span>
                                </div>
                            </div>
                            <div class="budget-labels">
                                <span class="budget-label-min">£500</span>
                                <span class="budget-label-max">£2k+</span>
                            </div>
                        </div>
                        <div class="calendar-container" id="calendar-container-${index}">
                            <div id="calendar-${index}" class="pikaday-container"></div>
                        </div>
                        
                        <div class="budget-calendar-container">
                            <div class="budget-calendar">
                                <div id = "budget-switch-${index}" class="budget-calendar-title-container">
                                    <h2  class="budget-calendar-title" >Budget</h2>
                                </div>
                                <div id = "calendar-switch-${index}" class="budget-calendar-title-container inactive">
                                    <h2  class="budget-calendar-title">Calendar</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="about-sections" id="features-container-${index}">
                    <div class="about-section">
                        <h3 class="about-title">About Me</h3>
                        <div class="features-container" id="about-me-container">
                            ${aboutMeinnerHTML}
                        </div>
                    </div>
                    <div class="lifestyle-section">
                        <h3 class="about-title">Lifestyle</h3>
                        <div class="features-container" id="lifestyle-container">
                            ${lifestyleinnerHTML}
                        </div>
                    </div>
                    <div class="interests-section">
                        <h3 class="about-title">Interests</h3>
                        <div class="features-container" id="interests-container">
                            ${interestsinnerHTML}
                        </div>
                    </div>
                </div>



                <div class="contact-remove-container">
                    <button id = "contact-match-btn-${index}" class="contact-match-btn">Contact</button>
                    <button id = "remove-match-btn-${index}" class="remove-match-btn">Remove Match</button>
                </div>


            </div>
            <div id="contact-modal-${index}" class="contact-modal">
                <div class="contact-modal-content">
                    <span class="close" id="close-btn-${index}">&times;</span>
                    <div class="chat-container">
                        <div class="messages" id="messages-${index}"></div>
                        <div class="message-input-container">    
                            <textarea id="message-input-${index}" placeholder="Message..."></textarea>
                            <button class="send-btn" id="send-btn-${index}">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        
        </div>
        `
}

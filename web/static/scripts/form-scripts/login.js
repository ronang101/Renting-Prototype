/**
 * This script handles user authentication for the Redwood Prototype platform using Firebase Authentication with Google Sign-In.
 * It initializes Firebase with the project's specific configuration and sets up the sign-in process. Upon successful sign-in,
 * the user's ID token is sent to the server for verification, and the user is redirected based on the server's response. This
 * script ensures a seamless authentication flow, enabling users to access the platform using their Google accounts.
 *
 * Dependencies:
 * - Firebase SDK : The script requires Firebase SDK to be included in the project as it uses Firebase Auth for Google Sign-In.
 *
 * Global Variables:
 * - firebaseConfig: Contains the Firebase project configuration details necessary for initializing Firebase services.
 *
 * Key Functionalities:
 * - signInWithGoogle(): Handles the Google Sign-In process using a popup and processes the authentication flow, including token verification and redirection.
 *
 * Event Listeners:
 * - 'click' on '#google-signin-btn': Attaches a click event listener to the Google sign-in button to initiate the sign-in process when clicked.
 */

/* global firebase */

const firebaseConfig = {
  // Configuration details for the Firebase project.
  apiKey: 'AIzaSyB4hEEmN3UNymYMGNMZ0WevuvHC1_ksaIY',
  authDomain: 'redwood-f9f87.firebaseapp.com',
  projectId: 'redwood-f9f87',
  storageBucket: 'redwood-f9f87.appspot.com',
  messagingSenderId: '799894576615',
  appId: '1:799894576615:web:3655e06194c8eaaf53b142',
  measurementId: 'G-SR762FJBG3'
}

// Initialize Firebase with the specified configuration.
firebase.initializeApp(firebaseConfig)

/**
 * Asynchronously handles the Google Sign-In process, including user authentication and server-side token verification.
 * On successful authentication, redirects the user based on server response.
 */
async function signInWithGoogle () {
  // Create a new instance of the GoogleAuthProvider class from Firebase auth.
  const provider = new firebase.auth.GoogleAuthProvider()

  try {
    // Attempt to sign in using a popup window, passing the Google provider as an argument.
    const result = await firebase.auth().signInWithPopup(provider)

    // Extract the ID token from the signed-in user's information.
    const idToken = await result.user.getIdToken()

    // Send the ID token to the server using a POST request for verification.
    const response = await fetch('/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: idToken })
    })

    // Await and parse the JSON response from the server.
    const data = await response.json()

    // Redirect the user based on the response.
    window.location.href = data.redirect
  } catch (error) {
    // Log any errors that occur during the sign-in process.
    console.error(error)
  }
}

// Attach a click event listener to the Google sign-in button, calling signInWithGoogle when clicked.
document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle)

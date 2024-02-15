/**
 * Manages real-time chat functionalities using Firebase Firestore and Authentication.
 *
 * Key Functionalities:
 * - Initializes Firebase for real-time messaging.
 * - Sends messages to specific users.
 * - Listens for new messages and updates the chat interface accordingly.
 *
 * How It Works:
 * - The ChatManager class encapsulates methods for sending messages, receiving messages, and generating chat IDs.
 * - Utilizes Firebase Firestore to store and retrieve chat messages in real-time.
 * - Leverages Firebase Authentication to manage user sessions and identify message senders.
 *
 * External Dependencies:
 * - Firebase: A comprehensive app development platform by Google. Requires Firebase Firestore for database operations and Firebase Authentication for user management.
 *
 * Usage:
 * - Instantiate the `ChatManager` with Firebase configuration.
 * - Use `sendMessage` to send a new message.
 * - Use `receiveMessages` to listen for incoming messages and update the UI.
 *
 */

/* global firebase */

// Class to handle chat functionalities using Firebase.
export class ChatManager {
  constructor (firebaseConfig) {
    // Initialize Firebase only once across the application.
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig) // Initialize Firebase with the specified configuration.
      firebase.auth().onAuthStateChanged((user) => {}) // Ensure the user is authenticated.
    }
    this.db = firebase.firestore() // Access Firestore service.
    this.auth = firebase.auth() // Access Authentication service.
    this.messageListener = null // Holds the reference to the Firestore listener for messages.
    this.chatHistory = {} // Stores the last message timestamp for each chat to manage message fetching.
  }

  // Handles the enter key press to send a message quickly.
  handleEnterKeyPress (event, matchIndex, matchUserId) {
    if (event.key === 'Enter') {
      event.preventDefault() // Prevent the default action to avoid form submission or newline.
      this.sendMessage(matchIndex, matchUserId) // Send message when Enter key is pressed.
    }
  }

  // Sends a message to a specific chat identified by matchUserId.
  sendMessage (matchIndex, matchUserId) {
    const currentUser = this.auth.currentUser // Get the currently authenticated user.
    const messageInput = document.getElementById(`message-input-${matchIndex}`) // Input field for message text.
    const messageText = messageInput.value // Text to be sent.
    const chatId = this.generateChatId(currentUser.uid, matchUserId) // Generate a unique ID for the chat.

    // Add the message to the 'messages' subcollection in Firestore.
    this.db.collection('chats').doc(chatId).collection('messages').add({
      text: messageText,
      senderId: currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp() // Server timestamp for consistency.
    }).then(() => {
      messageInput.value = '' // Clear the input field after sending.
    }).catch(error => {
      console.error('Error sending message: ', error)
    })
  }

  // Listens for new messages in a chat and updates the UI.
  receiveMessages (matchIndex, matchUserId) {
    const currentUser = this.auth.currentUser // Get the currently authenticated user.
    const messagesContainer = document.getElementById(`messages-${matchIndex}`) // Container for messages.
    const chatId = this.generateChatId(currentUser.uid, matchUserId) // Generate a unique ID for the chat.

    // Detach any previous message listener to avoid duplicate messages.
    if (this.messageListener) {
      this.messageListener()
    }

    // Initialize chat history for new chats.
    if (!this.chatHistory[chatId]) {
      this.chatHistory[chatId] = {
        lastMessageTimestamp: null
      }
    }

    // Query to fetch the latest 20 messages, or new messages since the last fetched message.
    let query = this.db.collection('chats').doc(chatId).collection('messages').orderBy('timestamp', 'desc')
    if (this.chatHistory[chatId].lastMessageTimestamp) {
      query = query.where('timestamp', '>', this.chatHistory[chatId].lastMessageTimestamp)
    }

    // Listen for message additions and update UI accordingly.
    this.messageListener = query.limit(20).onSnapshot(snapshot => {
      const changes = snapshot.docChanges().reverse() // Process messages from oldest to newest.
      changes.forEach(change => {
        if (change.type === 'added') {
          const messageData = change.doc.data()
          // Update the chat history state.
          this.chatHistory[chatId].lastMessageTimestamp = messageData.timestamp // Update last message timestamp.
          // Update UI.
          const messageElement = this.createMessageElement(messageData, currentUser.uid) // Create message element.
          messagesContainer.append(messageElement) // Append new messages to the bottom.
        }
      })

      messagesContainer.scrollTop = messagesContainer.scrollHeight // Scroll to the newest message.
    })
  }

  // Creates an HTML element for a message.
  createMessageElement (messageData, currentUserId) {
    const messageElement = document.createElement('div')
    messageElement.classList.add('message') // Base class for all messages.
    messageElement.innerText = messageData.text // Set the message text.
    if (messageData.senderId === currentUserId) {
      messageElement.classList.add('message-sent') // Additional styling for sent messages.
    } else {
      messageElement.classList.add('message-received') // Additional styling for received messages.
    }
    return messageElement // Return the constructed element.
  }

  // Generates a consistent chat ID for two users based on their user IDs.
  generateChatId (userId1, userId2) {
    // Ensure the chat ID is always in the same order regardless of who initiates the chat.
    return userId1 < userId2 ? `chat_${userId1}_${userId2}` : `chat_${userId2}_${userId1}`
  }
}

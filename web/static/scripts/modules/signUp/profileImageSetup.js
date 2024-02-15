/**
 * Initializes the functionality for uploading and previewing a profile image on user profile creation or editing forms.
 *
 * Key Functionalities:
 * - Allows users to select an image file from their device.
 * - Validates the dimensions of the selected image to meet minimum requirements.
 * - Displays a preview of the selected image with appropriate scaling and cropping.
 *
 * How It Works:
 * - Attaches an event listener to the image input field that triggers when a file is selected.
 * - Validates the image dimensions upon file selection and alerts the user if the dimensions are insufficient.
 * - Adjusts the preview image's dimensions to maintain aspect ratio and covers the preview area.
 *
 * External Dependencies:
 * - None. This function utilizes standard web APIs available in modern browsers for file handling and image manipulation.
 *
 * Usage:
 * - To be called on pages where users can create or edit their profiles, enabling them to upload and preview their profile image.
 *
 */

// Function to initialize profile image upload and preview functionality.
export const setupProfileImageUpload = () => {
  // Selects the file input and image preview elements from the DOM.
  const imageInput = document.getElementById('profile_image')
  const imagePreview = document.getElementById('image-preview')

  // Adds an event listener for the 'change' event on the image input.
  imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0] // Get the uploaded file.

    // Checks if a file is selected.
    if (file) {
      const img = new Image()
      img.src = URL.createObjectURL(file) // Create a temporary URL for the uploaded file.

      img.onload = () => {
        const { width, height } = img
        // Check if the image meets the minimum dimension requirements.
        if (width < 340 || height < 340) {
          alert('Please select an image that is at least 340x340 pixels.')
          return
        }

        let scaleFactor = 1
        // Adjusts the preview size while maintaining the aspect ratio.
        if (width > height) {
          scaleFactor = 170 / height // Calculate scale factor for height.
          imagePreview.style.width = `${width * scaleFactor}px`
          imagePreview.style.height = '170px'
        } else {
          scaleFactor = 170 / width // Calculate scale factor for width.
          imagePreview.style.height = `${height * scaleFactor}px`
          imagePreview.style.width = '170px'
        }

        imagePreview.style.objectFit = 'cover' // Ensure the image covers the preview area.
        imagePreview.style.objectPosition = 'center' // Center the image in the preview area.
        imagePreview.src = img.src // Set the source of the preview image to the uploaded file.
        URL.revokeObjectURL(img.src) // Revoke the temporary URL to free resources.
      }
    }
  })
}

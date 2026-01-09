const UPLOAD_ENDPOINT = 'https://pet.ferozkhandev.com/api/upload-image.php';

export interface UploadResponse {
  status: boolean;
  imageUrl?: string;
  fileName?: string;
  message?: string;
}

/**
 * Upload image to Hostinger server
 * @param imageUri - Local file URI from image picker
 * @returns Promise with upload response containing imageUrl
 */
export const uploadImage = async (imageUri: string): Promise<UploadResponse> => {
  try {
    // Validate URI
    if (!imageUri || !imageUri.trim()) {
      throw new Error('Image URI is required');
    }

    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    
    // Determine file type from extension
    const match = /\.(\w+)$/.exec(filename.toLowerCase());
    const extension = match ? match[1] : 'jpg';
    
    // Map extension to MIME type
    const mimeTypes: {[key: string]: string} = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    
    const type = mimeTypes[extension] || 'image/jpeg';
    const finalFilename = `image_${Date.now()}.${extension}`;

    // Create FormData
    const formData = new FormData();
    
    // Append file to FormData
    // For React Native, we need to use the proper format
    // Note: React Native FormData requires uri, type, and name
    formData.append('image', {
      uri: imageUri,
      type: type,
      name: finalFilename,
    } as any);

    console.log('Uploading image to:', UPLOAD_ENDPOINT);
    console.log('Image URI:', imageUri);
    console.log('File type:', type);

    // Upload to server
    // IMPORTANT: Don't set Content-Type header manually in React Native
    // React Native will automatically set it with the correct boundary
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - React Native handles it automatically with boundary
    });

    // Get response text first to see what we're getting
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);

    // Check if response is ok
    if (!response.ok) {
      // Try to parse error message
      try {
        const errorResult = JSON.parse(responseText);
        throw new Error(errorResult.message || `Upload failed with status: ${response.status}`);
      } catch (parseError) {
        throw new Error(`Upload failed with status: ${response.status}. Response: ${responseText.substring(0, 200)}`);
      }
    }

    // Parse JSON response
    let result: UploadResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from server. Please try again.');
    }

    if (result.status && result.imageUrl) {
      console.log('Image uploaded successfully:', result.imageUrl);
      return result;
    } else {
      const errorMessage = result.message || 'Image upload failed';
      console.error('Upload failed:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    // Provide user-friendly error messages
    if (error.message) {
      throw error;
    } else if (error.name === 'TypeError' && error.message?.includes('Network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to upload image. Please try again.');
    }
  }
};

/**
 * Upload user profile image
 * @param imageUri - Local file URI from image picker
 * @returns Promise with uploaded image URL
 */
export const uploadUserImage = async (imageUri: string): Promise<string> => {
  const result = await uploadImage(imageUri);
  if (result.imageUrl) {
    return result.imageUrl;
  }
  throw new Error('Failed to upload user image');
};

/**
 * Upload pet/animal image
 * @param imageUri - Local file URI from image picker
 * @returns Promise with uploaded image URL
 */
export const uploadPetImage = async (imageUri: string): Promise<string> => {
  const result = await uploadImage(imageUri);
  if (result.imageUrl) {
    return result.imageUrl;
  }
  throw new Error('Failed to upload pet image');
};


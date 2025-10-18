// OCR utility for AI Answer Assistant
// Uses Tesseract.js for text recognition in English and Vietnamese

/**
 * Extract text from image using Tesseract.js OCR
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @param {Array<string>} languages - Languages to use for OCR (default: ['eng', 'vie'])
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(imageDataUrl, languages = ['eng', 'vie']) {
  try {
    // Import Tesseract.js dynamically from CDN
    const { createWorker } = await importTesseract();
    
    // Create OCR worker with specified languages
    const worker = await createWorker(languages, {
      logger: (m) => {
        // Optional: Log OCR progress for debugging
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Configure OCR settings for better accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,-?!:;()[]{}"\'/\\@#$%^&*+=<>|`~àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſ' // Include Vietnamese characters
    });
    
    // Perform OCR recognition
    const { data: { text, confidence } } = await worker.recognize(imageDataUrl);
    
    // Terminate worker to free memory
    await worker.terminate();
    
    // Log confidence for debugging
    console.log(`OCR completed with confidence: ${confidence}%`);
    
    // Clean up the extracted text
    const cleanedText = cleanExtractedText(text);
    
    if (cleanedText.length < 3) {
      throw new Error('Insufficient text detected in the image');
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

/**
 * Import Tesseract.js dynamically from CDN
 * @returns {Promise<Object>} - Tesseract.js module
 */
async function importTesseract() {
  try {
    // Try to load from CDN
    const tesseract = await import('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');
    return tesseract;
  } catch (error) {
    // Fallback to alternative CDN
    try {
      const tesseract = await import('https://unpkg.com/tesseract.js@4/dist/tesseract.min.js');
      return tesseract;
    } catch (fallbackError) {
      throw new Error('Failed to load Tesseract.js library. Please check your internet connection.');
    }
  }
}

/**
 * Clean and normalize extracted text optimized for questions
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
function cleanExtractedText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let cleaned = text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Fix common OCR errors in questions
    .replace(/\b0\b/g, 'O') // Zero to O
    .replace(/\bl\b/g, 'I') // lowercase L to I
    .replace(/\brn\b/g, 'm') // rn to m
    .replace(/\bvv\b/g, 'w') // vv to w
    // Normalize question marks
    .replace(/[\?？]/g, '?')
    // Normalize parentheses for multiple choice
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    // Fix mathematical symbols
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    // Remove obviously incorrect characters but keep punctuation important for questions
    .replace(/[^\w\s\p{L}\p{M}\p{N}\p{P}\p{S}\(\)\[\]\{\}\?\!\+\-\*\/\=\<\>]/gu, '')
    // Preserve line breaks for multi-part questions
    .replace(/\n\s*\n/g, '\n')
    // Keep single letters (often part of multiple choice: A, B, C, D)
    .split(' ')
    .filter(word => word.length > 0 && (word.length > 1 || /[0-9A-Za-z\?\!]/.test(word)))
    .join(' ');
    
  // If it looks like a question, ensure it ends with proper punctuation
  if (cleaned.includes('what') || cleaned.includes('how') || cleaned.includes('why') || 
      cleaned.includes('when') || cleaned.includes('where') || cleaned.includes('which')) {
    if (!cleaned.match(/[\?\!\.]$/)) {
      cleaned += '?';
    }
  }
  
  return cleaned;
}

/**
 * Validate image data URL
 * @param {string} dataUrl - Image data URL to validate
 * @returns {boolean} - True if valid image data URL
 */
function isValidImageDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return false;
  }
  
  // Check if it's a valid data URL format
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,/i;
  return dataUrlRegex.test(dataUrl);
}

/**
 * Preprocess image for better OCR accuracy
 * @param {string} imageDataUrl - Original image data URL
 * @returns {Promise<string>} - Preprocessed image data URL
 */
async function preprocessImageForOCR(imageDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply image enhancement filters
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale for better OCR
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Apply contrast enhancement
          const contrast = 1.2;
          const enhancedGray = Math.min(255, Math.max(0, contrast * gray));
          
          // Apply threshold for better text contrast
          const threshold = 128;
          const binaryValue = enhancedGray > threshold ? 255 : 0;
          
          data[i] = binaryValue;     // Red
          data[i + 1] = binaryValue; // Green
          data[i + 2] = binaryValue; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to data URL
        const processedDataUrl = canvas.toDataURL('image/png');
        resolve(processedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for preprocessing'));
      };
      
      img.src = imageDataUrl;
      
    } catch (error) {
      reject(new Error(`Image preprocessing failed: ${error.message}`));
    }
  });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    extractTextFromImage,
    cleanExtractedText,
    isValidImageDataUrl,
    preprocessImageForOCR
  };
} else {
  // Browser environment - attach to window object
  window.OCRUtils = {
    extractTextFromImage,
    cleanExtractedText,
    isValidImageDataUrl,
    preprocessImageForOCR
  };
}
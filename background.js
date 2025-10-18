// Background service worker for AI Answer Assistant
// Handles screen capture, image cropping, OCR, and AI processing

// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'activate_ai') {
    activateScreenSelection();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture_area') {
    handleAreaCapture(request.coordinates, sender.tab.id)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

/**
 * Activate screen selection mode by injecting content script
 */
async function activateScreenSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script to start selection mode
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Send message to existing content script to start selection
        window.postMessage({ type: 'START_SELECTION' }, '*');
      }
    });
  } catch (error) {
    console.error('Error activating screen selection:', error);
  }
}

/**
 * Handle area capture and processing
 */
async function handleAreaCapture(coordinates, tabId) {
  try {
    // Step 1: Capture the visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Step 2: Crop the image based on coordinates
    const croppedImage = await cropImage(screenshot, coordinates);
    
    // Step 3: Extract text using OCR
    const extractedText = await extractTextFromImage(croppedImage);
    
    if (!extractedText.trim()) {
      return { 
        success: false, 
        error: 'No text detected in the selected area' 
      };
    }
    
    // Step 4: Get AI response
    const aiResponse = await getAIResponse(extractedText);
    
    return {
      success: true,
      extractedText: extractedText,
      aiResponse: aiResponse
    };
    
  } catch (error) {
    console.error('Error in handleAreaCapture:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Crop image based on selection coordinates using OffscreenCanvas
 */
async function cropImage(dataUrl, coordinates) {
  try {
    // Create image bitmap from data URL
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    
    // Create canvas for cropping
    const canvas = new OffscreenCanvas(
      coordinates.width, 
      coordinates.height
    );
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped portion
    ctx.drawImage(
      imageBitmap,
      coordinates.x, coordinates.y, coordinates.width, coordinates.height,
      0, 0, coordinates.width, coordinates.height
    );
    
    // Convert to blob then data URL
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(croppedBlob);
    });
    
  } catch (error) {
    console.error('Error cropping image:', error);
    throw new Error('Failed to crop image: ' + error.message);
  }
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(imageDataUrl) {
  try {
    // Import Tesseract.js dynamically
    const { createWorker } = await import('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');
    
    const worker = await createWorker(['eng', 'vie']); // English and Vietnamese
    
    const { data: { text } } = await worker.recognize(imageDataUrl);
    
    await worker.terminate();
    
    return text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Get AI response using OpenAI API
 */
async function getAIResponse(text) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['google_api_key']);
    const apiKey = result.google_api_key;
    
    if (!apiKey) {
      throw new Error('Google API key not found. Please set it in the popup.');
    }
    
    // Auto-discover best available model
    let modelName = 'models/gemini-pro'; // fallback
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const models = modelsData.models || [];
        const suitableModel = models.find(model => 
          model.supportedGenerationMethods?.includes('generateContent') &&
          model.name.includes('gemini')
        ) || models.find(model => 
          model.supportedGenerationMethods?.includes('generateContent')
        );
        if (suitableModel) {
          modelName = suitableModel.name;
        }
      }
    } catch (e) {
      console.warn('Could not auto-discover model, using fallback');
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert question-answering assistant. The following text was extracted from an image and likely contains a question that needs to be answered. The text may have OCR errors, so interpret it intelligently.\n\nQuestion: "${text}"\n\nPlease provide a complete, accurate answer. For math problems, show steps. For multiple choice, explain the correct answer. Be thorough and educational.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}
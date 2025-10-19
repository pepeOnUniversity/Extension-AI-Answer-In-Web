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
    console.log('Step 1: Capturing screenshot...');
    // Step 1: Capture the visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    console.log('Step 2: Cropping image...');
    // Step 2: Crop the image based on coordinates
    const croppedImage = await cropImage(screenshot, coordinates);
    
    console.log('Step 3: Sending to content script for OCR...');
    // Step 3: Send cropped image to content script for OCR processing
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'process_ocr_and_ai',
        imageData: croppedImage
      }, async (response) => {
        if (response && response.success && response.extractedText) {
          console.log('Step 4: Getting AI response...');
          console.log('Extracted text:', response.extractedText);
          
          try {
            // Step 4: Get AI response with timeout
            const aiResponse = await Promise.race([
              getAIResponse(response.extractedText),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI response timeout')), 15000)
              )
            ]);
            
            resolve({
              success: true,
              extractedText: response.extractedText,
              aiResponse: aiResponse
            });
          } catch (error) {
            console.error('AI Error:', error);
            resolve({ 
              success: false, 
              error: 'AI processing failed: ' + error.message 
            });
          }
        } else {
          resolve({
            success: false,
            error: response?.error || 'OCR processing failed'
          });
        }
      });
    });
    
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
 * Get AI response using OpenAI API
 */
async function getAIResponse(text) {
  try {
    // Get settings from storage
    const result = await chrome.storage.sync.get([
      'ai_provider', 
      'api_key', 
      'ollama_url'
    ]);
    
    const provider = result.ai_provider || 'huggingface';
    const apiKey = result.api_key || '';
    const ollamaUrl = result.ollama_url || 'http://localhost:11434';
    
    // Load AIUtils
    const aiUtils = await loadAIUtils();
    
    // Configure AI request
    const config = {
      provider: provider,
      apiKey: apiKey,
      ollamaUrl: ollamaUrl,
      maxTokens: 500,
      temperature: 0.7
    };
    
    // Get AI response using the new multi-provider system
    const aiResponse = await aiUtils.getAIResponse(text, config);
    return aiResponse;
    
  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Load AI utilities from utils/ai.js
 */
async function loadAIUtils() {
  try {
    // Import AIUtils from utils/ai.js
    const aiUtilsModule = await import(chrome.runtime.getURL('utils/ai.js'));
    return aiUtilsModule;
  } catch (error) {
    console.error('Failed to load AI utilities:', error);
    throw new Error('Failed to load AI utilities');
  }
}
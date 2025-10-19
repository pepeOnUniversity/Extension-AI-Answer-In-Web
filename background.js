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
  
  if (request.action === 'capture_area_auto_ai') {
    handleAreaCaptureAutoAI(request.coordinates, sender.tab.id)
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
 * Handle area capture with automatic OCR and AI processing
 */
async function handleAreaCaptureAutoAI(coordinates, tabId) {
  try {
    console.log('Auto AI: Step 1 - Capturing screenshot...');
    // Step 1: Capture the visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    console.log('Auto AI: Step 2 - Cropping image...');
    // Step 2: Crop the image based on coordinates
    const croppedImage = await cropImage(screenshot, coordinates);
    
    console.log('Auto AI: Step 3 - Processing OCR automatically...');
    // Step 3: Process OCR automatically using free services
    const ocrResult = await processOCRAuto(croppedImage);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: 'OCR processing failed: ' + ocrResult.error
      };
    }
    
    console.log('Auto AI: Step 4 - Getting AI response...');
    console.log('Extracted text:', ocrResult.extractedText);
    
    // Step 4: Get AI response automatically
    try {
      const aiResponse = await Promise.race([
        getAIResponse(ocrResult.extractedText),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI response timeout')), 15000)
        )
      ]);
      
      return {
        success: true,
        extractedText: ocrResult.extractedText,
        aiResponse: aiResponse
      };
    } catch (error) {
      console.error('Auto AI Error:', error);
      return { 
        success: false, 
        error: 'AI processing failed: ' + error.message 
      };
    }
    
  } catch (error) {
    console.error('Error in handleAreaCaptureAutoAI:', error);
    return { 
      success: false, 
      error: error.message 
    };
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
 * Process OCR automatically using free services
 */
async function processOCRAuto(imageDataUrl) {
  console.log('Starting automatic OCR processing...');
  
  // Try OCR services with fallback
  const ocrServices = [
    () => tryOCRSpace(imageDataUrl),
    () => tryImageToText(imageDataUrl)
  ];
  
  // Try automatic OCR services with shorter timeouts
  for (let i = 0; i < ocrServices.length; i++) {
    try {
      console.log(`Trying OCR service ${i + 1}...`);
      const result = await Promise.race([
        ocrServices[i](),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service timeout')), 8000))
      ]);
      
      if (result.success) {
        console.log(`OCR service ${i + 1} succeeded!`);
        return result;
      }
      console.log(`Service ${i + 1} failed:`, result.error);
    } catch (error) {
      console.log(`Service ${i + 1} error:`, error.message);
    }
  }
  
  // All automatic services failed
  console.log('All OCR services failed');
  return { 
    success: false, 
    error: 'All OCR services are temporarily unavailable' 
  };
}

/**
 * Try OCR.space API
 */
async function tryOCRSpace(imageDataUrl) {
  const base64Image = imageDataUrl.split(',')[1];
  
  const formData = new FormData();
  formData.append('base64Image', `data:image/png;base64,${base64Image}`);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2');
  
  const response = await Promise.race([
    fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
  ]);
  
  if (!response.ok) {
    throw new Error(`OCR.space error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.OCRExitCode === 1 && data.ParsedResults && data.ParsedResults[0]) {
    const extractedText = data.ParsedResults[0].ParsedText.trim();
    if (extractedText && extractedText.length >= 2) {
      return { success: true, extractedText };
    }
  }
  
  throw new Error('No text detected by OCR.space');
}

/**
 * Try image-to-text.p.rapidapi.com (free tier)
 */
async function tryImageToText(imageDataUrl) {
  const base64Image = imageDataUrl.split(',')[1];
  
  // Convert base64 to blob for the API
  const byteCharacters = atob(base64Image);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('image', blob, 'image.png');
  
  const response = await Promise.race([
    fetch('https://image-to-text.p.rapidapi.com/', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': 'demo', // Use demo key for testing
        'X-RapidAPI-Host': 'image-to-text.p.rapidapi.com'
      },
      body: formData
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
  ]);
  
  if (!response.ok) {
    throw new Error(`ImageToText error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.text && data.text.trim().length >= 2) {
    return { success: true, extractedText: data.text.trim() };
  }
  
  throw new Error('No text detected by ImageToText');
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
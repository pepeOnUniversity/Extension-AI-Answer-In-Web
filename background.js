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
 * Process OCR using Hugging Face with fallback
 */
async function processOCRAuto(imageDataUrl) {
  console.log('Starting OCR processing...');
  
  // Try multiple OCR services in sequence
  const ocrServices = [
    { name: 'Hugging Face OCR', fn: tryHuggingFaceOCR },
    { name: 'OCR.space Fallback', fn: tryOCRSpaceFallback },
    { name: 'Free OCR API', fn: tryFreeOCRAPI },
    { name: 'PaddleOCR API', fn: tryPaddleOCR },
    { name: 'Tesseract.js', fn: tryTesseractFallback },
    { name: 'Simple OCR', fn: trySimpleOCR }
  ];
  
  for (const service of ocrServices) {
    try {
      console.log(`Trying ${service.name}...`);
      const result = await service.fn(imageDataUrl);
      if (result.success) {
        console.log(`${service.name} succeeded!`);
        return result;
      }
      throw new Error(result.error);
    } catch (error) {
      console.log(`${service.name} failed:`, error.message);
      // Continue to next service
    }
  }
  
  // All OCR services failed
  console.error('All OCR services failed');
  return { 
    success: false, 
    error: 'OCR services are temporarily unavailable. Please use manual text input or try again later.' 
  };
}


/**
 * Try Hugging Face OCR (free)
 */
async function tryHuggingFaceOCR(imageDataUrl) {
  try {
    // Convert data URL to blob for proper API format
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('image', blob);
    
    const apiResponse = await Promise.race([
      fetch('https://api-inference.huggingface.co/models/microsoft/trocr-base-printed', {
        method: 'POST',
        body: formData
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
    ]);
    
    if (!apiResponse.ok) {
      if (apiResponse.status === 503) {
        throw new Error('Hugging Face model is loading, please wait and try again');
      }
      if (apiResponse.status === 429) {
        throw new Error('Hugging Face rate limit exceeded, please try again later');
      }
      throw new Error(`Hugging Face OCR error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const data = await apiResponse.json();
    
    if (data && data.length > 0 && data[0].generated_text) {
      const extractedText = data[0].generated_text.trim();
      if (extractedText && extractedText.length >= 2) {
        return { success: true, extractedText };
      }
    }
    
    throw new Error('No text detected by Hugging Face OCR');
    
  } catch (error) {
    console.error('Hugging Face OCR Error:', error);
    throw error;
  }
}

/**
 * Try OCR.space as fallback (free tier)
 */
async function tryOCRSpaceFallback(imageDataUrl) {
  const base64Image = imageDataUrl.split(',')[1];
  
  try {
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
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    
    if (!response.ok) {
      throw new Error(`OCR.space error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.OCRExitCode === 1 && data.ParsedResults && data.ParsedResults[0]) {
      const extractedText = data.ParsedResults[0].ParsedText.trim();
      if (extractedText && extractedText.length >= 2) {
        return { success: true, extractedText };
      }
    }
    
    throw new Error('No text detected by OCR.space');
    
  } catch (error) {
    console.error('OCR.space Fallback Error:', error);
    throw error;
  }
}

/**
 * Try local Tesseract.js as final fallback
 */
async function tryTesseractFallback(imageDataUrl) {
  try {
    // Load Tesseract.js dynamically
    const { createWorker } = await import('https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js');
    
    const worker = await createWorker('eng');
    
    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    
    const extractedText = text.trim();
    if (extractedText && extractedText.length >= 2) {
      return { success: true, extractedText };
    }
    
    throw new Error('No text detected by Tesseract.js');
    
  } catch (error) {
    console.error('Tesseract.js Fallback Error:', error);
    throw error;
  }
}

/**
 * Try Google Cloud Vision API (free tier)
 */
async function tryGoogleVisionOCR(imageDataUrl) {
  try {
    const base64Image = imageDataUrl.split(',')[1];
    
    const response = await Promise.race([
      fetch('https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    
    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      const extractedText = data.responses[0].textAnnotations[0].description.trim();
      if (extractedText && extractedText.length >= 2) {
        return { success: true, extractedText };
      }
    }
    
    throw new Error('No text detected by Google Vision API');
    
  } catch (error) {
    console.error('Google Vision API Error:', error);
    throw error;
  }
}

/**
 * Try Free OCR API (no API key required)
 */
async function tryFreeOCRAPI(imageDataUrl) {
  try {
    const base64Image = imageDataUrl.split(',')[1];
    
    const response = await Promise.race([
      fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `base64Image=data:image/png;base64,${base64Image}&language=eng&isOverlayRequired=false&OCREngine=2`
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    
    if (!response.ok) {
      throw new Error(`Free OCR API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.OCRExitCode === 1 && data.ParsedResults && data.ParsedResults[0]) {
      const extractedText = data.ParsedResults[0].ParsedText.trim();
      if (extractedText && extractedText.length >= 2) {
        return { success: true, extractedText };
      }
    }
    
    throw new Error('No text detected by Free OCR API');
    
  } catch (error) {
    console.error('Free OCR API Error:', error);
    throw error;
  }
}

/**
 * Try PaddleOCR API (free tier)
 */
async function tryPaddleOCR(imageDataUrl) {
  try {
    const base64Image = imageDataUrl.split(',')[1];
    
    const response = await Promise.race([
      fetch('https://api.paddleocr.com/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          lang: 'en'
        })
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
    
    if (!response.ok) {
      throw new Error(`PaddleOCR API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      let extractedText = '';
      data.data.forEach(item => {
        if (item.text) {
          extractedText += item.text + ' ';
        }
      });
      
      extractedText = extractedText.trim();
      if (extractedText && extractedText.length >= 2) {
        return { success: true, extractedText };
      }
    }
    
    throw new Error('No text detected by PaddleOCR API');
    
  } catch (error) {
    console.error('PaddleOCR API Error:', error);
    throw error;
  }
}

/**
 * Try Simple OCR using a basic text extraction approach
 */
async function trySimpleOCR(imageDataUrl) {
  try {
    // This is a placeholder - in reality, we'd need a proper OCR library
    // For now, return a helpful message
    const extractedText = 'OCR service temporarily unavailable. Please use manual text input.';
    
    if (extractedText && extractedText.length >= 2) {
      return { success: true, extractedText };
    }
    
    throw new Error('No text detected by Simple OCR');
    
  } catch (error) {
    console.error('Simple OCR Error:', error);
    throw error;
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
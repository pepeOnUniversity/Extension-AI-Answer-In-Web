// Content script for AI Answer Assistant
// Handles screen selection overlay and result display

let isSelectionMode = false;
let selectionOverlay = null;
let startX = 0, startY = 0;
let currentSelection = null;

// Listen for messages from background script
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_SELECTION') {
    startSelectionMode();
  }
});

// Listen for messages from background script for OCR processing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'process_ocr_and_ai') {
    processOCR(request.imageData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

/**
 * Initialize selection mode
 */
function startSelectionMode() {
  if (isSelectionMode) return;
  
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    showError('Extension context invalidated. Please reload the extension and refresh this page.');
    return;
  }
  
  isSelectionMode = true;
  createSelectionOverlay();
  
  // Change cursor to crosshair
  document.body.style.cursor = 'crosshair';
  
  // Add event listeners
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  // Show instructions
  showInstructions();
}

/**
 * Create the selection overlay
 */
function createSelectionOverlay() {
  // Create overlay container
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'ai-assistant-overlay';
  selectionOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.1);
    z-index: 999999;
    pointer-events: none;
  `;
  
  // Create selection box
  const selectionBox = document.createElement('div');
  selectionBox.id = 'ai-selection-box';
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #00aaff;
    background: rgba(0, 170, 255, 0.1);
    display: none;
    pointer-events: none;
  `;
  
  selectionOverlay.appendChild(selectionBox);
  document.body.appendChild(selectionOverlay);
}

/**
 * Show instructions to user
 */
function showInstructions() {
  const instructions = document.createElement('div');
  instructions.id = 'ai-instructions';
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 1000000;
    animation: fadeIn 0.3s ease;
  `;
  instructions.innerHTML = '🎯 Drag to select question → Auto OCR → Auto AI Answer • Press ESC to cancel';
  
  // Add fadeIn animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(instructions);
  
  // Remove instructions after 3 seconds
  setTimeout(() => {
    if (instructions.parentNode) {
      instructions.remove();
    }
  }, 3000);
}

/**
 * Handle mouse down - start selection
 */
function handleMouseDown(event) {
  if (!isSelectionMode) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  startX = event.clientX;
  startY = event.clientY;
  
  const selectionBox = document.getElementById('ai-selection-box');
  selectionBox.style.display = 'block';
  selectionBox.style.left = startX + 'px';
  selectionBox.style.top = startY + 'px';
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';
}

/**
 * Handle mouse move - update selection
 */
function handleMouseMove(event) {
  if (!isSelectionMode) return;
  
  const selectionBox = document.getElementById('ai-selection-box');
  if (selectionBox.style.display !== 'block') return;
  
  event.preventDefault();
  
  const currentX = event.clientX;
  const currentY = event.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
}

/**
 * Handle mouse up - complete selection
 */
function handleMouseUp(event) {
  if (!isSelectionMode) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const selectionBox = document.getElementById('ai-selection-box');
  if (selectionBox.style.display !== 'block') return;
  
  const currentX = event.clientX;
  const currentY = event.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  // Minimum selection size check
  if (width < 10 || height < 10) {
    endSelectionMode();
    return;
  }
  
  // Store selection coordinates
  currentSelection = { x: left, y: top, width, height };
  
  // End selection mode
  endSelectionMode();
  
  // Show loading indicator
  showLoadingIndicator();
  
  // Record start time for processing duration
  const startTime = Date.now();
  
  // Send coordinates to background script for auto OCR + AI processing
  try {
    chrome.runtime.sendMessage({
      action: 'capture_area_auto_ai',
      coordinates: currentSelection
    }, (response) => {
      hideLoadingIndicator();
      
      // Calculate processing time
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Check for extension context invalidation
      if (chrome.runtime.lastError) {
        showError('Extension context invalidated. Please reload the extension and refresh this page.');
        return;
      }
      
      if (response && response.success) {
        showAIResult(response.extractedText, response.aiResponse, currentSelection, processingTime);
      } else {
        showError(response?.error || 'Failed to process selection');
      }
    });
  } catch (error) {
    hideLoadingIndicator();
    showError('Extension context invalidated. Please reload the extension and refresh this page.');
  }
  
  // Update loading status periodically
  let loadingStep = 0;
  const loadingSteps = [
    '📸 Capturing area...',
    '✂️ Processing image...',
    '👁️ Auto-extracting text...',
    '🤖 Auto-generating AI answer...'
  ];
  
  window.loadingUpdateInterval = setInterval(() => {
    const statusElement = document.getElementById('loading-status');
    if (statusElement && loadingStep < loadingSteps.length - 1) {
      loadingStep++;
      statusElement.textContent = loadingSteps[loadingStep];
    } else {
      clearInterval(window.loadingUpdateInterval);
    }
  }, 3000);
}

/**
 * Handle keyboard events
 */
function handleKeyDown(event) {
  if (event.key === 'Escape' && isSelectionMode) {
    event.preventDefault();
    endSelectionMode();
  }
}

/**
 * End selection mode
 */
function endSelectionMode() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  
  // Remove overlay
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }
  
  // Remove instructions
  const instructions = document.getElementById('ai-instructions');
  if (instructions) {
    instructions.remove();
  }
  
  // Restore cursor
  document.body.style.cursor = '';
  
  // Remove event listeners
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('mouseup', handleMouseUp, true);
  document.removeEventListener('keydown', handleKeyDown, true);
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  const loading = document.createElement('div');
  loading.id = 'ai-loading';
  loading.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    font-family: Arial, sans-serif;
    font-size: 16px;
    z-index: 1000001;
    text-align: center;
  `;
  loading.innerHTML = `
    <div style="margin-bottom: 10px;">🤖 AI Answer Assistant</div>
    <div id="loading-status" style="font-size: 14px;">📸 Capturing area...</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 8px;">Auto OCR → Auto AI Answer (100% Free)</div>
  `;
  
  document.body.appendChild(loading);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const loading = document.getElementById('ai-loading');
  if (loading) {
    loading.remove();
  }
  
  // Clear any running intervals
  if (window.loadingUpdateInterval) {
    clearInterval(window.loadingUpdateInterval);
  }
}

/**
 * Show AI result in a beautiful popup
 */
function showAIResult(extractedText, aiResponse, coordinates, processingTime = '0.0') {
  // Remove any existing result box
  const existing = document.getElementById('ai-result-box');
  if (existing) existing.remove();
  
  // Create result container
  const resultBox = document.createElement('div');
  resultBox.id = 'ai-result-box';
  resultBox.style.cssText = `
    position: fixed;
    top: ${Math.min(coordinates.y + coordinates.height + 10, window.innerHeight - 400)}px;
    left: ${Math.min(coordinates.x, window.innerWidth - 400)}px;
    width: 380px;
    max-height: 350px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    z-index: 1000002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    animation: slideIn 0.3s ease;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  if (!document.head.querySelector('style[data-ai-assistant]')) {
    style.setAttribute('data-ai-assistant', 'true');
    document.head.appendChild(style);
  }
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div style="font-weight: 600; font-size: 16px;">🤖 AI Answer</div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 12px; opacity: 0.8;">⚡ ${processingTime}s</span>
      <button id="ai-close-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">×</button>
    </div>
  `;
  
  // Content area
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 20px;
    overflow-y: auto;
    max-height: 280px;
  `;
  
  // Extracted text section
  const extractedSection = document.createElement('div');
  extractedSection.style.cssText = `
    margin-bottom: 15px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  `;
  extractedSection.innerHTML = `
    <div style="font-weight: 600; font-size: 14px; color: #495057; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span>📝 Extracted Text:</span>
      <button id="copy-extracted-text" style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">📋 Copy</button>
    </div>
    <div style="font-size: 13px; color: #6c757d; line-height: 1.4; font-family: monospace;">${extractedText}</div>
  `;
  
  // AI response section
  const responseSection = document.createElement('div');
  responseSection.style.cssText = `
    padding: 12px;
    background: #fff;
    border-radius: 8px;
    border-left: 4px solid #28a745;
  `;
  responseSection.innerHTML = `
    <div style="font-weight: 600; font-size: 14px; color: #495057; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span>💡 AI Response:</span>
      <button id="copy-ai-response" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">📋 Copy</button>
    </div>
    <div style="font-size: 14px; color: #212529; line-height: 1.5;">${aiResponse}</div>
  `;
  
  content.appendChild(extractedSection);
  content.appendChild(responseSection);
  
  resultBox.appendChild(header);
  resultBox.appendChild(content);
  
  document.body.appendChild(resultBox);
  
  // Add close functionality
  const closeBtn = document.getElementById('ai-close-btn');
  closeBtn.onclick = () => resultBox.remove();
  closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  
  // Add copy functionality for AI response
  const copyBtn = document.getElementById('copy-ai-response');
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(aiResponse);
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = '#28a745';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.background = '#28a745';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      copyBtn.textContent = '❌ Failed';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    }
  };
  
  // Add copy functionality for extracted text
  const copyExtractedBtn = document.getElementById('copy-extracted-text');
  copyExtractedBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      copyExtractedBtn.textContent = '✅ Copied!';
      copyExtractedBtn.style.background = '#667eea';
      setTimeout(() => {
        copyExtractedBtn.textContent = '📋 Copy';
        copyExtractedBtn.style.background = '#667eea';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      copyExtractedBtn.textContent = '❌ Failed';
      setTimeout(() => {
        copyExtractedBtn.textContent = '📋 Copy';
      }, 2000);
    }
  };
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closeOnOutside(event) {
      if (!resultBox.contains(event.target)) {
        resultBox.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    });
  }, 100);
  
  // Auto-close after 30 seconds
  setTimeout(() => {
    if (resultBox.parentNode) {
      resultBox.remove();
    }
  }, 30000);
}

/**
 * Process OCR using Hugging Face OCR only
 */
async function processOCR(imageDataUrl) {
  console.log('Starting Hugging Face OCR processing...');
  
  try {
    const result = await tryHuggingFaceOCR(imageDataUrl);
    if (result.success) {
      return result;
    }
    console.log('Hugging Face OCR failed:', result.error);
  } catch (error) {
    console.log('Hugging Face OCR error:', error.message);
  }
  
  // If Hugging Face OCR fails - show manual input
  console.log('Hugging Face OCR failed, showing manual input...');
  return await tryManualInput(imageDataUrl);
}

/**
 * Try Hugging Face OCR API
 */
async function tryHuggingFaceOCR(imageDataUrl) {
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
    fetch('https://api-inference.huggingface.co/models/microsoft/trocr-base-printed', {
      method: 'POST',
      body: formData
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
  ]);
  
  if (!response.ok) {
    throw new Error(`Hugging Face OCR error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data && data.length > 0 && data[0].generated_text) {
    const extractedText = data[0].generated_text.trim();
    if (extractedText && extractedText.length >= 2) {
      return { success: true, extractedText };
    }
  }
  
  throw new Error('No text detected by Hugging Face OCR');
}

/**
 * Manual input as final fallback
 */
async function tryManualInput(imageDataUrl) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000002;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 25px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      text-align: center;
    `;
    
    content.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">📝 Manual Text Input</h3>
      <p style="color: #666; margin-bottom: 15px;">OCR services are temporarily unavailable. Please type the text/question from your selection:</p>
      <img src="${imageDataUrl}" style="max-width: 100%; max-height: 200px; margin-bottom: 15px; border: 2px solid #007bff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <textarea id="quick-text" placeholder="Type the question or text you want AI to answer..." style="width: 100%; height: 100px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; resize: vertical; font-family: Arial, sans-serif; font-size: 14px;"></textarea>
      <div style="margin-top: 15px; font-size: 12px; color: #666; margin-bottom: 15px;">💡 Tip: Press Ctrl+Enter to submit quickly</div>
      <div style="margin-top: 10px;">
        <button id="submit-quick" style="background: #007bff; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px; font-weight: 500;">🤖 Get AI Answer</button>
        <button id="cancel-quick" style="background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    setTimeout(() => document.getElementById('quick-text').focus(), 100);
    
    document.getElementById('submit-quick').onclick = () => {
      const text = document.getElementById('quick-text').value.trim();
      modal.remove();
      
      if (text.length > 0) {
        resolve({ success: true, extractedText: text });
      } else {
        resolve({ success: false, error: 'No text provided' });
      }
    };
    
    document.getElementById('cancel-quick').onclick = () => {
      modal.remove();
      resolve({ success: false, error: 'Cancelled by user' });
    };
    
    document.getElementById('quick-text').onkeydown = (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        document.getElementById('submit-quick').click();
      }
    };
  });
}


/**
 * Show error message
 */
function showError(message) {
  const errorBox = document.createElement('div');
  errorBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border: 1px solid #dc3545;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000001;
    font-family: Arial, sans-serif;
    max-width: 300px;
    text-align: center;
  `;
  errorBox.innerHTML = `
    <div style="color: #dc3545; font-size: 18px; margin-bottom: 10px;">⚠️</div>
    <div style="color: #721c24; font-weight: 600; margin-bottom: 5px;">Error</div>
    <div style="color: #721c24; font-size: 14px;">${message}</div>
  `;
  
  document.body.appendChild(errorBox);
  
  setTimeout(() => {
    if (errorBox.parentNode) {
      errorBox.remove();
    }
  }, 5000);
}

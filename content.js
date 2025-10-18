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

/**
 * Initialize selection mode
 */
function startSelectionMode() {
  if (isSelectionMode) return;
  
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
  instructions.innerHTML = '🎯 Drag to select an area • Press ESC to cancel';
  
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
  
  // Send coordinates to background script
  chrome.runtime.sendMessage({
    action: 'capture_area',
    coordinates: currentSelection
  }, (response) => {
    hideLoadingIndicator();
    
    if (response && response.success) {
      showAIResult(response.extractedText, response.aiResponse, currentSelection);
    } else {
      showError(response?.error || 'Failed to process selection');
    }
  });
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
    <div style="font-size: 14px;">Processing your selection...</div>
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
}

/**
 * Show AI result in a beautiful popup
 */
function showAIResult(extractedText, aiResponse, coordinates) {
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
    <button id="ai-close-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">×</button>
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
    <div style="font-weight: 600; font-size: 14px; color: #495057; margin-bottom: 8px;">📝 Extracted Text:</div>
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
    <div style="font-weight: 600; font-size: 14px; color: #495057; margin-bottom: 8px;">💡 AI Response:</div>
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
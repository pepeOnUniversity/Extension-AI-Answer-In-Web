// Content script for handling screen capture
let isCapturing = false;
let captureOverlay = null;
let startX = 0, startY = 0, endX = 0, endY = 0;

// Debug function to check extension status
function debugExtensionStatus() {
    console.log('=== AI Answer Assistant Debug Info ===');
    console.log('isCapturing:', isCapturing);
    console.log('captureOverlay exists:', !!captureOverlay);
    console.log('html2canvas available:', typeof html2canvas !== 'undefined');
    console.log('Tesseract available:', typeof Tesseract !== 'undefined');
    console.log('Chrome runtime available:', typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined');
    console.log('Document ready state:', document.readyState);
    console.log('Document body exists:', !!document.body);
    console.log('=====================================');
}

// Run debug on load
debugExtensionStatus();

// Function to load required libraries
function loadLibraries() {
    return new Promise((resolve, reject) => {
        console.log('Loading libraries...');
        
        // Check if libraries are already loaded
        if (typeof html2canvas !== 'undefined' && typeof Tesseract !== 'undefined') {
            console.log('Libraries already loaded');
            resolve();
            return;
        }
        
        // Load html2canvas first
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = chrome.runtime.getURL('html2canvas.min.js');
        html2canvasScript.onload = () => {
            console.log('html2canvas loaded successfully');
            // Then load Tesseract
            const tesseractScript = document.createElement('script');
            tesseractScript.src = chrome.runtime.getURL('tesseract.min.js');
            tesseractScript.onload = () => {
                console.log('Tesseract loaded successfully');
                resolve();
            };
            tesseractScript.onerror = (error) => {
                console.error('Failed to load Tesseract:', error);
                reject(new Error('Failed to load Tesseract: ' + error.message));
            };
            document.head.appendChild(tesseractScript);
        };
        html2canvasScript.onerror = (error) => {
            console.error('Failed to load html2canvas:', error);
            reject(new Error('Failed to load html2canvas: ' + error.message));
        };
        document.head.appendChild(html2canvasScript);
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startCapture') {
        startScreenCapture();
        sendResponse({success: true});
    }
});

function startScreenCapture() {
    console.log('Starting screen capture...');
    
    if (isCapturing) {
        console.log('Already capturing, ignoring request');
        return;
    }
    
    isCapturing = true;
    
    try {
        createCaptureOverlay();
        console.log('Capture overlay created successfully');
    } catch (error) {
        console.error('Error creating capture overlay:', error);
        isCapturing = false;
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Lỗi tạo overlay: ' + error.message
        });
    }
}

function createCaptureOverlay() {
    console.log('Creating capture overlay...');
    
    try {
        // Remove existing overlay if any
        if (captureOverlay) {
            console.log('Removing existing overlay');
            document.body.removeChild(captureOverlay);
        }
        
        // Create overlay
        captureOverlay = document.createElement('div');
        captureOverlay.id = 'ai-capture-overlay';
        captureOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            cursor: crosshair;
            user-select: none;
        `;
        
        // Create instruction text
        const instruction = document.createElement('div');
        instruction.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            z-index: 1000000;
        `;
        instruction.textContent = 'Kéo thả để chọn vùng câu hỏi, nhấn ESC để hủy';
        captureOverlay.appendChild(instruction);
        
        // Create selection rectangle
        const selection = document.createElement('div');
        selection.id = 'ai-selection';
        selection.style.cssText = `
            position: fixed;
            border: 2px solid #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            display: none;
            pointer-events: none;
            z-index: 1000001;
        `;
        captureOverlay.appendChild(selection);
        
        document.body.appendChild(captureOverlay);
        console.log('Overlay added to document body');
        
        // Add event listeners
        captureOverlay.addEventListener('mousedown', handleMouseDown);
        captureOverlay.addEventListener('mousemove', handleMouseMove);
        captureOverlay.addEventListener('mouseup', handleMouseUp);
        captureOverlay.addEventListener('keydown', handleKeyDown);
        captureOverlay.focus();
        
        // Add click handler to close on click outside
        captureOverlay.addEventListener('click', function(e) {
            if (e.target === captureOverlay) {
                cancelCapture();
            }
        });
        
        console.log('Capture overlay created successfully');
    } catch (error) {
        console.error('Error in createCaptureOverlay:', error);
        throw error;
    }
}

function handleMouseDown(e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    
    const selection = document.getElementById('ai-selection');
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
}

function handleMouseMove(e) {
    if (startX === 0 && startY === 0) return;
    
    e.preventDefault();
    endX = e.clientX;
    endY = e.clientY;
    
    const selection = document.getElementById('ai-selection');
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
}

function handleMouseUp(e) {
    if (startX === 0 && startY === 0) return;
    
    e.preventDefault();
    endX = e.clientX;
    endY = e.clientY;
    
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    if (width < 10 || height < 10) {
        // Selection too small, cancel
        cancelCapture();
        return;
    }
    
    // Capture the selected area
    captureSelectedArea();
}

function handleKeyDown(e) {
    if (e.key === 'Escape') {
        cancelCapture();
    }
}

function captureSelectedArea() {
    console.log('Capturing selected area...');
    
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    console.log('Selection coordinates:', { left, top, width, height });
    
    // Load required libraries if not already loaded
    loadLibraries().then(() => {
        console.log('Libraries loaded, starting capture...');
        performCapture(left, top, width, height);
    }).catch(error => {
        console.error('Failed to load libraries:', error);
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Không thể tải thư viện cần thiết: ' + error.message
        });
        cleanup();
    });
}

function performCapture(left, top, width, height) {
    console.log('Performing capture at:', left, top, width, height);
    
    // Double check that libraries are loaded
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas not loaded');
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Thư viện chụp ảnh chưa được tải'
        });
        return;
    }
    
    if (typeof Tesseract === 'undefined') {
        console.error('Tesseract not loaded');
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Thư viện OCR chưa được tải'
        });
        return;
    }
    
    // Find the main content element
    const elements = document.elementsFromPoint(left + width/2, top + height/2);
    let contentElement = document.body;
    
    for (let el of elements) {
        if (el.tagName && !['HTML', 'BODY'].includes(el.tagName)) {
            contentElement = el;
            break;
        }
    }
    
    console.log('Content element:', contentElement);
    
    // Capture using html2canvas
    html2canvas(contentElement, {
        x: left,
        y: top,
        width: width,
        height: height,
        useCORS: true,
        allowTaint: true,
        scale: 1, // Reduced scale for better performance
        logging: true
    }).then(canvas => {
        console.log('Canvas created:', canvas);
        
        // Convert to blob and send to background script
        canvas.toBlob(function(blob) {
            if (!blob) {
                console.error('Failed to create blob');
                chrome.runtime.sendMessage({
                    action: 'captureComplete',
                    success: false,
                    error: 'Không thể tạo ảnh từ canvas'
                });
                cleanup();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async function() {
                const base64 = reader.result.split(',')[1];
                console.log('Base64 data length:', base64.length);
                
                // Process OCR directly in content script
                await performOCR(base64, left, top, width, height);
            };
            reader.onerror = function() {
                console.error('FileReader error');
                chrome.runtime.sendMessage({
                    action: 'captureComplete',
                    success: false,
                    error: 'Lỗi đọc file ảnh'
                });
                cleanup();
            };
            reader.readAsDataURL(blob);
        }, 'image/png');
    }).catch(error => {
        console.error('Capture error:', error);
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Lỗi chụp màn hình: ' + error.message
        });
        cleanup();
    });
}

function cancelCapture() {
    cleanup();
    chrome.runtime.sendMessage({
        action: 'captureComplete',
        success: false,
        error: 'Đã hủy chụp màn hình'
    });
}

async function performOCR(base64Data, left, top, width, height) {
    console.log('Starting OCR with Tesseract.js');
    
    // Get OCR language setting
    const result = await chrome.storage.sync.get(['ocrLanguage']);
    const ocrLanguage = result.ocrLanguage || 'eng+vie';
    
    // Convert base64 to image data
    const imageData = `data:image/png;base64,${base64Data}`;
    
    try {
        // Use Tesseract.js for OCR with enhanced settings (like imagetotext.info)
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            ocrLanguage, // Use user-selected language
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                },
                // Enhanced OCR settings for better accuracy
                tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
                tessedit_char_whitelist: '', // Allow all characters
                preserve_interword_spaces: '1', // Preserve spaces between words
                tessedit_ocr_engine_mode: '1' // Neural nets LSTM engine only
            }
        );
        
        console.log('OCR Result:', text);
        
        if (!text || text.trim().length === 0) {
            chrome.runtime.sendMessage({
                action: 'captureComplete',
                success: false,
                error: 'Không tìm thấy text trong ảnh'
            });
            cleanup();
            return;
        }
        
        // Send text to background script for AI processing
        chrome.runtime.sendMessage({
            action: 'processText',
            text: text.trim(),
            coordinates: { left, top, width, height }
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Message send error:', chrome.runtime.lastError);
            }
        });
        
        // Clean up
        cleanup();
        
    } catch (error) {
        console.error('OCR Error:', error);
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: 'Lỗi OCR: ' + error.message
        });
        cleanup();
    }
}

function cleanup() {
    isCapturing = false;
    startX = startY = endX = endY = 0;
    
    if (captureOverlay) {
        document.body.removeChild(captureOverlay);
        captureOverlay = null;
    }
}

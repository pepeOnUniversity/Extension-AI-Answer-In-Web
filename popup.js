document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    const openaiKeyInput = document.getElementById('openai-key');
    const ocrLanguageSelect = document.getElementById('ocr-language');
    const startCaptureBtn = document.getElementById('start-capture');
    const saveSettingsBtn = document.getElementById('save-settings');
    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    
    // Debug function
    function debugPopupStatus() {
        console.log('=== Popup Debug Info ===');
        console.log('openaiKeyInput:', !!openaiKeyInput);
        console.log('ocrLanguageSelect:', !!ocrLanguageSelect);
        console.log('startCaptureBtn:', !!startCaptureBtn);
        console.log('saveSettingsBtn:', !!saveSettingsBtn);
        console.log('statusDiv:', !!statusDiv);
        console.log('resultDiv:', !!resultDiv);
        console.log('Chrome APIs available:', {
            runtime: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',
            tabs: typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined',
            storage: typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined'
        });
        console.log('======================');
    }
    
    debugPopupStatus();

    // Load saved settings
    loadSettings();

    // Save settings
    saveSettingsBtn.addEventListener('click', function() {
        const openaiKey = openaiKeyInput.value.trim();
        const ocrLanguage = ocrLanguageSelect.value;
        
        if (!openaiKey) {
            showStatus('Vui lòng nhập OpenAI API key!', 'error');
            return;
        }
        
        chrome.storage.sync.set({
            openaiKey: openaiKey,
            ocrLanguage: ocrLanguage
        }, function() {
            showStatus('Đã lưu cài đặt thành công!', 'success');
        });
    });

    // Start capture
    startCaptureBtn.addEventListener('click', function() {
        console.log('Start capture button clicked');
        
        const openaiKey = openaiKeyInput.value.trim();
        if (!openaiKey) {
            showStatus('Vui lòng nhập OpenAI API key trước!', 'error');
            return;
        }

        // Save key temporarily if not saved
        chrome.storage.sync.set({ openaiKey: openaiKey });

        showStatus('Đang khởi tạo chụp màn hình...', 'loading');
        startCaptureBtn.disabled = true;

        // Send message to content script to start capture
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            console.log('Active tab:', tabs[0]);
            
            if (!tabs[0]) {
                showStatus('Không tìm thấy tab hiện tại', 'error');
                startCaptureBtn.disabled = false;
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'startCapture'
            }, function(response) {
                console.log('Response from content script:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    showStatus('Lỗi: ' + chrome.runtime.lastError.message, 'error');
                    startCaptureBtn.disabled = false;
                } else if (response && response.success) {
                    showStatus('Kéo thả để chọn vùng câu hỏi...', 'loading');
                    // Keep button disabled until capture is complete
                } else {
                    showStatus('Không thể khởi tạo chụp màn hình', 'error');
                    startCaptureBtn.disabled = false;
                }
            });
        });
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'captureComplete') {
            startCaptureBtn.disabled = false;
            if (request.success) {
                showStatus('Đang xử lý ảnh và phân tích...', 'loading');
            } else {
                showStatus('Chụp màn hình thất bại: ' + request.error, 'error');
            }
        } else if (request.action === 'analysisComplete') {
            startCaptureBtn.disabled = false;
            if (request.success) {
                showStatus('Phân tích hoàn tất!', 'success');
                showResult(request.result);
            } else {
                showStatus('Lỗi phân tích: ' + request.error, 'error');
            }
        }
    });

    function loadSettings() {
        chrome.storage.sync.get(['openaiKey', 'ocrLanguage'], function(result) {
            if (result.openaiKey) {
                openaiKeyInput.value = result.openaiKey;
            }
            if (result.ocrLanguage) {
                ocrLanguageSelect.value = result.ocrLanguage;
            }
        });
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.classList.remove('hidden');
    }

    function showResult(result) {
        resultDiv.textContent = result;
        resultDiv.classList.remove('hidden');
    }

    function hideStatus() {
        statusDiv.classList.add('hidden');
    }
});

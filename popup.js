// Popup script for AI Answer Assistant
// Handles API key management and connection testing

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  
  // Load saved settings on startup
  loadSavedSettings();
  
  // Event listeners
  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);
  clearBtn.addEventListener('click', clearSettings);
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
  
  
  /**
   * Load saved settings from chrome storage
   */
  async function loadSavedSettings() {
    try {
      const result = await chrome.storage.sync.get(['api_key']);
      
      if (result.api_key) {
        apiKeyInput.value = result.api_key;
        showStatus('Settings loaded', 'success');
        setTimeout(() => hideStatus(), 2000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('Error loading saved settings', 'error');
    }
  }
  
  
  /**
   * Save settings to chrome storage
   */
  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    
    try {
      const settings = {
        api_key: apiKey
      };
      
      await chrome.storage.sync.set(settings);
      showStatus('Settings saved successfully!', 'success');
      
      // Change save button to indicate success
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Saved';
      saveBtn.classList.remove('btn-primary');
      saveBtn.classList.add('btn-success');
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('btn-success');
        saveBtn.classList.add('btn-primary');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error saving settings', 'error');
    }
  }
  
  /**
   * Test Hugging Face connection
   */
  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    // Show loading state
    showLoading(true);
    hideStatus();
    
    try {
      const config = {
        provider: 'huggingface',
        apiKey: apiKey
      };
      
      const result = await testAPIConnection(config);
      
      if (result.success) {
        showStatus(result.message, 'success');
        
        // Change test button to indicate success
        const originalText = testBtn.textContent;
        testBtn.textContent = '✓ Connected';
        testBtn.classList.remove('btn-primary');
        testBtn.classList.add('btn-success');
        
        setTimeout(() => {
          testBtn.textContent = originalText;
          testBtn.classList.remove('btn-success');
          testBtn.classList.add('btn-primary');
        }, 3000);
        
      } else {
        showStatus(`Connection failed: ${result.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Connection test error:', error);
      showStatus('Connection test failed', 'error');
    } finally {
      showLoading(false);
    }
  }
  
  /**
   * Clear saved settings
   */
  async function clearSettings() {
    try {
      await chrome.storage.sync.remove(['api_key']);
      apiKeyInput.value = '';
      showStatus('Settings cleared', 'warning');
      
      // Change clear button to indicate action
      const originalText = clearBtn.textContent;
      clearBtn.textContent = '✓ Cleared';
      
      setTimeout(() => {
        clearBtn.textContent = originalText;
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing settings:', error);
      showStatus('Error clearing settings', 'error');
    }
  }
  
  /**
   * Test AI provider connection using AIUtils
   */
  async function testAPIConnection(config) {
    try {
      // Load AIUtils if not already loaded
      if (typeof window.AIUtils === 'undefined') {
        await loadScript('utils/ai.js');
      }
      
      return await window.AIUtils.testAPIConnection(config);
    } catch (error) {
      return {
        success: false,
        message: `Failed to load AI utilities: ${error.message}`
      };
    }
  }
  
  /**
   * Load external script
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(src);
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * Show status message
   */
  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} fade-in`;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide error and warning messages after 5 seconds
    if (type === 'error' || type === 'warning') {
      setTimeout(() => hideStatus(), 5000);
    }
  }
  
  /**
   * Hide status message
   */
  function hideStatus() {
    statusDiv.classList.add('hidden');
  }
  
  /**
   * Show/hide loading indicator
   */
  function showLoading(show) {
    if (show) {
      loadingDiv.style.display = 'block';
      testBtn.disabled = true;
    } else {
      loadingDiv.style.display = 'none';
      testBtn.disabled = false;
    }
  }
  
  /**
   * Validate API key format
   */
  function validateApiKeyFormat(apiKey) {
    // Google API keys start with 'AIzaSy' and are typically 39 characters long
    return /^AIzaSy[A-Za-z0-9\-_]{33}$/.test(apiKey);
  }
  
  
});

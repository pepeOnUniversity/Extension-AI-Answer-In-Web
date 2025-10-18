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
  
  // Load saved API key on startup
  loadSavedApiKey();
  
  // Event listeners
  saveBtn.addEventListener('click', saveApiKey);
  testBtn.addEventListener('click', testConnection);
  clearBtn.addEventListener('click', clearApiKey);
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });
  
  /**
   * Load saved API key from chrome storage
   */
  async function loadSavedApiKey() {
    try {
      const result = await chrome.storage.sync.get(['google_api_key']);
      if (result.google_api_key) {
        apiKeyInput.value = result.google_api_key;
        showStatus('API key loaded', 'success');
        
        // Auto-hide success message after 2 seconds
        setTimeout(() => hideStatus(), 2000);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      showStatus('Error loading saved key', 'error');
    }
  }
  
  /**
   * Save API key to chrome storage
   */
  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'warning');
      apiKeyInput.focus();
      return;
    }
    
    if (!validateApiKeyFormat(apiKey)) {
      showStatus('Invalid API key format', 'error');
      apiKeyInput.focus();
      return;
    }
    
    try {
      await chrome.storage.sync.set({ google_api_key: apiKey });
      showStatus('API key saved successfully!', 'success');
      
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
      console.error('Error saving API key:', error);
      showStatus('Error saving API key', 'error');
    }
  }
  
  /**
   * Test API connection
   */
  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key first', 'warning');
      apiKeyInput.focus();
      return;
    }
    
    if (!validateApiKeyFormat(apiKey)) {
      showStatus('Invalid API key format', 'error');
      return;
    }
    
    // Show loading state
    showLoading(true);
    hideStatus();
    
    try {
      const result = await testAPIConnection(apiKey);
      
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
   * Clear saved API key
   */
  async function clearApiKey() {
    try {
      await chrome.storage.sync.remove(['google_api_key']);
      apiKeyInput.value = '';
      showStatus('API key cleared', 'warning');
      
      // Change clear button to indicate action
      const originalText = clearBtn.textContent;
      clearBtn.textContent = '✓ Cleared';
      
      setTimeout(() => {
        clearBtn.textContent = originalText;
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing API key:', error);
      showStatus('Error clearing API key', 'error');
    }
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
  
  /**
   * Test API connection by first listing models, then testing
   */
  async function testAPIConnection(apiKey) {
    try {
      // First, list available models
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      
      if (!modelsResponse.ok) {
        const errorData = await modelsResponse.json().catch(() => ({}));
        if (modelsResponse.status === 403) {
          throw new Error('API key does not have access to Gemini API. Please enable the Generative Language API in Google Cloud Console.');
        }
        throw new Error(`API Error: ${errorData.error?.message || modelsResponse.statusText}`);
      }
      
      const modelsData = await modelsResponse.json();
      const availableModels = modelsData.models || [];
      
      // Find a suitable model for generateContent
      const suitableModel = availableModels.find(model => 
        model.supportedGenerationMethods?.includes('generateContent') &&
        (model.name.includes('gemini') || model.name.includes('text'))
      );
      
      if (!suitableModel) {
        throw new Error('No suitable models found. Available models: ' + 
          availableModels.map(m => m.name.split('/').pop()).join(', '));
      }
      
      console.log('Using model:', suitableModel.name);
      
      // Test with the found model
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1/${suitableModel.name}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Answer-Assistant/1.0'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Please respond with exactly: "Connection successful"'
            }]
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 10,
          }
        })
      });
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${testResponse.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await testResponse.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return {
          success: true,
          message: `Gemini API connection successful! Using model: ${suitableModel.name.split('/').pop()}`
        };
      } else {
        return {
          success: false,
          message: 'Invalid response format'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }
});

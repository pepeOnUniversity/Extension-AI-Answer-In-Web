// Popup script for AI Answer Assistant
// Handles API key management and connection testing

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const aiProviderSelect = document.getElementById('aiProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const apiKeyGroup = document.getElementById('apiKeyGroup');
  const apiKeyLabel = document.getElementById('apiKeyLabel');
  const apiKeyHelp = document.getElementById('apiKeyHelp');
  const ollamaUrlGroup = document.getElementById('ollamaUrlGroup');
  const ollamaUrlInput = document.getElementById('ollamaUrl');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  
  // Load saved settings on startup
  loadSavedSettings();
  
  // Event listeners
  aiProviderSelect.addEventListener('change', updateProviderUI);
  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);
  clearBtn.addEventListener('click', clearSettings);
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
  
  // Add diagnostic button
  const diagnosticBtn = document.createElement('button');
  diagnosticBtn.textContent = 'Check APIs';
  diagnosticBtn.className = 'btn btn-primary';
  diagnosticBtn.style.marginTop = '10px';
  diagnosticBtn.style.width = '100%';
  diagnosticBtn.addEventListener('click', checkAPIs);
  document.querySelector('.button-group').parentNode.insertBefore(diagnosticBtn, document.querySelector('.instructions'));
  
  /**
   * Load saved settings from chrome storage
   */
  async function loadSavedSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'ai_provider', 
        'api_key', 
        'ollama_url'
      ]);
      
      if (result.ai_provider) {
        aiProviderSelect.value = result.ai_provider;
      }
      
      if (result.api_key) {
        apiKeyInput.value = result.api_key;
      }
      
      if (result.ollama_url) {
        ollamaUrlInput.value = result.ollama_url;
      }
      
      updateProviderUI();
      
      if (result.api_key || result.ai_provider === 'huggingface' || result.ai_provider === 'ollama') {
        showStatus('Settings loaded', 'success');
        setTimeout(() => hideStatus(), 2000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('Error loading saved settings', 'error');
    }
  }
  
  /**
   * Update UI based on selected provider
   */
  function updateProviderUI() {
    const provider = aiProviderSelect.value;
    
    // Update API key section
    switch (provider) {
      case 'huggingface':
        apiKeyGroup.style.display = 'block';
        apiKeyLabel.textContent = 'Hugging Face Token (Optional):';
        apiKeyInput.placeholder = 'hf_... (optional for better rate limits)';
        apiKeyHelp.innerHTML = '🆓 <strong>100% Free!</strong> No API key required, but having one gives better rate limits.';
        ollamaUrlGroup.classList.add('hidden');
        break;
        
      case 'groq':
        apiKeyGroup.style.display = 'block';
        apiKeyLabel.textContent = 'Groq API Key:';
        apiKeyInput.placeholder = 'gsk_...';
        apiKeyHelp.innerHTML = '⚡ <strong>Free tier available!</strong> Get your API key at <a href="https://console.groq.com/" target="_blank" style="color: #ffc107;">console.groq.com</a>';
        ollamaUrlGroup.classList.add('hidden');
        break;
        
      case 'ollama':
        apiKeyGroup.style.display = 'none';
        ollamaUrlGroup.classList.remove('hidden');
        break;
        
      case 'gemini':
        apiKeyGroup.style.display = 'block';
        apiKeyLabel.textContent = 'Google API Key:';
        apiKeyInput.placeholder = 'AIzaSy...';
        apiKeyHelp.innerHTML = '🔍 <strong>Paid service</strong>. Get your API key from Google Cloud Console.';
        ollamaUrlGroup.classList.add('hidden');
        break;
    }
  }
  
  /**
   * Save settings to chrome storage
   */
  async function saveSettings() {
    const provider = aiProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const ollamaUrl = ollamaUrlInput.value.trim();
    
    // Validate based on provider
    if (provider === 'groq' || provider === 'gemini') {
      if (!apiKey) {
        showStatus(`Please enter ${provider === 'groq' ? 'Groq' : 'Google'} API key`, 'warning');
        apiKeyInput.focus();
        return;
      }
    }
    
    if (provider === 'ollama' && !ollamaUrl) {
      showStatus('Please enter Ollama server URL', 'warning');
      ollamaUrlInput.focus();
      return;
    }
    
    try {
      const settings = {
        ai_provider: provider,
        api_key: apiKey,
        ollama_url: ollamaUrl
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
   * Test AI provider connection
   */
  async function testConnection() {
    const provider = aiProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const ollamaUrl = ollamaUrlInput.value.trim();
    
    // Validate based on provider
    if (provider === 'groq' || provider === 'gemini') {
      if (!apiKey) {
        showStatus(`Please enter ${provider === 'groq' ? 'Groq' : 'Google'} API key first`, 'warning');
        apiKeyInput.focus();
        return;
      }
    }
    
    if (provider === 'ollama' && !ollamaUrl) {
      showStatus('Please enter Ollama server URL first', 'warning');
      ollamaUrlInput.focus();
      return;
    }
    
    // Show loading state
    showLoading(true);
    hideStatus();
    
    try {
      const config = {
        provider: provider,
        apiKey: apiKey,
        ollamaUrl: ollamaUrl
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
      await chrome.storage.sync.remove(['ai_provider', 'api_key', 'ollama_url']);
      aiProviderSelect.value = 'huggingface';
      apiKeyInput.value = '';
      ollamaUrlInput.value = 'http://localhost:11434';
      updateProviderUI();
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
  
  /**
   * Check if both Vision API and Generative Language API are enabled
   */
  async function checkAPIs() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter your API key first', 'warning');
      return;
    }
    
    showLoading(true);
    hideStatus();
    
    const results = [];
    
    // Test Free OCR Service
    try {
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const formData = new FormData();
      formData.append('base64Image', `data:image/png;base64,${testImage}`);
      formData.append('language', 'eng');
      
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      
      if (ocrResponse.ok) {
        results.push('✅ Free OCR Service: Available and working');
      } else {
        results.push('⚠️ Free OCR Service: Temporarily unavailable');
      }
    } catch (error) {
      results.push('❌ Free OCR Service: Network error');
    }
    
    // Test Generative Language API
    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      
      if (geminiResponse.status === 403) {
        results.push('❌ Generative Language API: Not enabled');
      } else if (geminiResponse.status === 401) {
        results.push('❌ Generative Language API: Invalid API key');
      } else if (geminiResponse.ok) {
        results.push('✅ Generative Language API: Enabled and working');
      } else {
        results.push(`⚠️ Generative Language API: Error ${geminiResponse.status}`);
      }
    } catch (error) {
      results.push('❌ Generative Language API: Network error');
    }
    
    showLoading(false);
    showStatus(results.join('\n'), results.every(r => r.includes('✅')) ? 'success' : 'warning');
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

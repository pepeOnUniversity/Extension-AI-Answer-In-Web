// AI utility for AI Answer Assistant
// Handles Google Gemini API integration

/**
 * Get AI response from Google Gemini
 * @param {string} extractedText - Text extracted from OCR
 * @param {string} apiKey - Google API key
 * @param {Object} options - Additional options for customization
 * @returns {Promise<string>} - AI response
 */
async function getAIResponse(extractedText, apiKey, options = {}) {
  if (!extractedText || typeof extractedText !== 'string') {
    throw new Error('Invalid text provided for AI processing');
  }
  
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Google API key is required');
  }
  
  // Default configuration
  const config = {
    model: options.model || 'gemini-pro',
    maxTokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
    systemPrompt: options.systemPrompt || getDefaultSystemPrompt(),
    userPrompt: options.userPrompt || getDefaultUserPrompt(extractedText),
    ...options
  };
  
  try {
    const response = await makeGeminiRequest(apiKey, config);
    return response;
  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Get the best available model for the API key
 */
async function getBestAvailableModel(apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (!response.ok) return 'gemini-pro'; // fallback
    
    const data = await response.json();
    const models = data.models || [];
    
    // Prefer gemini models that support generateContent
    const suitableModel = models.find(model => 
      model.supportedGenerationMethods?.includes('generateContent') &&
      model.name.includes('gemini')
    ) || models.find(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    return suitableModel ? suitableModel.name : 'gemini-pro';
  } catch (error) {
    return 'gemini-pro'; // fallback
  }
}

/**
 * Make request to Google Gemini API
 * @param {string} apiKey - Google API key
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} - AI response content
 */
async function makeGeminiRequest(apiKey, config, retryCount = 0) {
  // Auto-discover best model if using default
  let modelName = config.model;
  if (config.model === 'gemini-pro') {
    modelName = await getBestAvailableModel(apiKey);
  }
  
  const requestBody = {
    contents: [{
      parts: [{
        text: `${config.systemPrompt}\n\n${config.userPrompt}`
      }]
    }],
    generationConfig: {
      temperature: config.temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: config.maxTokens,
    }
  };
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Answer-Assistant/1.0'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    
    // Handle specific error types
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Google API key.');
    } else if (response.status === 429) {
      // Rate limit - retry with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeGeminiRequest(apiKey, config, retryCount + 1);
      }
      throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. Please check your API key permissions.');
    } else {
      throw new Error(errorMessage);
    }
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response format from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * Get default system prompt for AI optimized for questions
 * @returns {string} - Default system prompt
 */
function getDefaultSystemPrompt() {
  return `You are an expert AI assistant specialized in answering questions extracted from images using OCR. Your primary goal is to provide accurate, helpful answers to questions.

Key Instructions:
1. ASSUME the extracted text contains a question or problem that needs solving
2. If text quality is poor due to OCR errors, use context clues to understand the intended question
3. Provide direct, complete answers with clear explanations
4. For multiple choice questions, explain why the correct answer is right
5. For math problems, show step-by-step solutions
6. For academic questions, provide educational explanations
7. If text is in Vietnamese, respond in Vietnamese; otherwise respond in English
8. If the text seems incomplete, make reasonable assumptions and explain what you're assuming

Answer Style:
- Start directly with the answer
- Then provide explanation if needed
- Use bullet points or numbered steps for complex answers
- Be thorough but concise
- Focus on being helpful and educational`;
}

/**
 * Generate default user prompt optimized for questions
 * @param {string} extractedText - Text extracted from OCR
 * @returns {string} - Formatted user prompt
 */
function getDefaultUserPrompt(extractedText) {
  return `Please answer this question extracted from an image:

"${extractedText}"

Note: The text above was extracted using OCR, so there might be some recognition errors. Please:
1. Interpret the question even if there are OCR mistakes
2. Provide a complete, accurate answer
3. Show your work for math problems
4. Explain your reasoning for complex questions
5. If it's multiple choice, explain why other options are incorrect

Answer the question thoroughly and helpfully.`;
}

/**
 * Test Google Gemini API connection
 * @param {string} apiKey - Google API key to test
 * @returns {Promise<Object>} - Test result with success status and message
 */
async function testAPIConnection(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      success: false,
      message: 'API key is required'
    };
  }
  
  try {
    const testResponse = await makeGeminiRequest(apiKey, {
      model: 'gemini-pro',
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Please respond with exactly: "Connection successful"',
      maxTokens: 10,
      temperature: 0
    });
    
    if (testResponse.toLowerCase().includes('connection successful')) {
      return {
        success: true,
        message: 'Gemini API connection successful!'
      };
    } else {
      return {
        success: true,
        message: 'API connection working!'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Generate context-aware prompts based on text content
 * @param {string} extractedText - Extracted text to analyze
 * @returns {Object} - Context-aware prompts
 */
function generateContextPrompts(extractedText) {
  const text = extractedText.toLowerCase();
  let context = 'general';
  let systemPrompt = getDefaultSystemPrompt();
  let userPrompt = getDefaultUserPrompt(extractedText);
  
  // Detect content type and adjust prompts accordingly
  if (text.includes('?') || text.includes('what') || text.includes('how') || text.includes('why')) {
    context = 'question';
    systemPrompt = 'You are an expert assistant specializing in answering questions clearly and accurately. Provide direct, helpful answers.';
    userPrompt = `Please answer this question based on the extracted text: "${extractedText}"`;
  }
  
  else if (text.includes('=') || text.match(/\d+[\+\-\*\/]\d+/) || text.includes('solve') || text.includes('calculate')) {
    context = 'math';
    systemPrompt = 'You are a math tutor. Help solve mathematical problems step by step with clear explanations.';
    userPrompt = `Please help solve this math problem: "${extractedText}"`;
  }
  
  else if (text.includes('function') || text.includes('def ') || text.includes('class ') || text.includes('import ')) {
    context = 'code';
    systemPrompt = 'You are a programming assistant. Help explain, debug, or improve code with clear technical guidance.';
    userPrompt = `Please analyze this code and provide helpful insights: "${extractedText}"`;
  }
  
  else if (text.includes('error') || text.includes('exception') || text.includes('failed') || text.includes('bug')) {
    context = 'error';
    systemPrompt = 'You are a technical troubleshooting assistant. Help diagnose and solve technical problems.';
    userPrompt = `Please help diagnose and solve this technical issue: "${extractedText}"`;
  }
  
  else if (text.length > 200) {
    context = 'document';
    systemPrompt = 'You are a document analysis assistant. Summarize and extract key insights from longer texts.';
    userPrompt = `Please summarize and provide key insights from this text: "${extractedText}"`;
  }
  
  return {
    context,
    systemPrompt,
    userPrompt
  };
}

/**
 * Validate and clean extracted text before sending to AI
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned and validated text
 */
function validateAndCleanText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Remove excessive whitespace and normalize
  let cleanedText = text
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check minimum length
  if (cleanedText.length < 3) {
    throw new Error('Text too short for meaningful AI analysis');
  }
  
  // Check maximum length (to avoid API limits)
  const maxLength = 2000;
  if (cleanedText.length > maxLength) {
    cleanedText = cleanedText.substring(0, maxLength) + '...';
  }
  
  return cleanedText;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    getAIResponse,
    testAPIConnection,
    generateContextPrompts,
    validateAndCleanText,
    makeGeminiRequest,
    getDefaultSystemPrompt,
    getDefaultUserPrompt
  };
} else {
  // Browser environment - attach to window object
  window.AIUtils = {
    getAIResponse,
    testAPIConnection,
    generateContextPrompts,
    validateAndCleanText,
    makeGeminiRequest,
    getDefaultSystemPrompt,
    getDefaultUserPrompt
  };
}

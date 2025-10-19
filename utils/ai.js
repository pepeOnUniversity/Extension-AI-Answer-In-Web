// AI utility for AI Answer Assistant
// Handles multiple free AI providers integration

/**
 * Get AI response from Hugging Face
 * @param {string} extractedText - Text extracted from OCR
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} - AI response
 */
async function getAIResponse(extractedText, config = {}) {
  if (!extractedText || typeof extractedText !== 'string') {
    throw new Error('Invalid text provided for AI processing');
  }
  
  // Default configuration for Hugging Face
  const options = {
    provider: 'huggingface',
    model: config.model || 'microsoft/DialoGPT-medium',
    maxTokens: config.maxTokens || 500,
    temperature: config.temperature || 0.7,
    systemPrompt: config.systemPrompt || getDefaultSystemPrompt(),
    userPrompt: config.userPrompt || getDefaultUserPrompt(extractedText),
    apiKey: config.apiKey || '',
    ...config
  };
  
  try {
    const response = await makeHuggingFaceRequest(extractedText, options);
    return response;
  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Get default model for Hugging Face
 */
function getDefaultModel(provider) {
  return 'microsoft/DialoGPT-medium';
}


/**
 * Make request to Hugging Face Inference API (FREE)
 * @param {string} extractedText - Text to process
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} - AI response content
 */
async function makeHuggingFaceRequest(extractedText, config) {
  const model = config.model || 'microsoft/DialoGPT-medium';
  const prompt = `${config.systemPrompt}\n\nUser: ${extractedText}\nAssistant:`;
  
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: config.maxTokens || 500,
        temperature: config.temperature || 0.7,
        return_full_text: false
      }
    })
  });
  
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Model is loading, please wait a moment and try again');
    }
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (Array.isArray(data) && data[0] && data[0].generated_text) {
    return data[0].generated_text.trim();
  } else if (data.error) {
    throw new Error(`Hugging Face error: ${data.error}`);
  } else {
    throw new Error('Unexpected response format from Hugging Face');
  }
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
 * Test Hugging Face connection
 * @param {Object} config - Configuration object with credentials
 * @returns {Promise<Object>} - Test result with success status and message
 */
async function testAPIConnection(config) {
  const { apiKey = '', model } = config;
  
  try {
    const testText = 'Test connection';
    const testResponse = await makeHuggingFaceRequest(testText, {
      model: model || 'microsoft/DialoGPT-medium',
      systemPrompt: 'You are a helpful assistant.',
      maxTokens: 20,
      temperature: 0,
      apiKey
    });
    
    return {
      success: true,
      message: 'Hugging Face API connection successful!'
    };
    
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
    makeHuggingFaceRequest,
    getDefaultSystemPrompt,
    getDefaultUserPrompt,
    getDefaultModel
  };
} else {
  // Browser environment - attach to window object
  window.AIUtils = {
    getAIResponse,
    testAPIConnection,
    generateContextPrompts,
    validateAndCleanText,
    makeHuggingFaceRequest,
    getDefaultSystemPrompt,
    getDefaultUserPrompt,
    getDefaultModel
  };
}

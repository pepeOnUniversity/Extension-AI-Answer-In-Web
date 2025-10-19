// Background script for handling AI processing
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'processText') {
        processWithAI(request.text, request.coordinates);
    }
});

async function processWithAI(text, coordinates) {
    try {
        console.log('Processing text with AI:', text);
        
        // Send OCR result to popup first
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: true,
            ocrText: text
        });
        
        // Process with AI
        await processWithAIInternal(text);
        
    } catch (error) {
        console.error('AI Processing Error:', error);
        chrome.runtime.sendMessage({
            action: 'captureComplete',
            success: false,
            error: error.message
        });
    }
}

async function processWithAIInternal(questionText) {
    try {
        // Get OpenAI API key from storage
        const result = await chrome.storage.sync.get(['openaiKey']);
        const apiKey = result.openaiKey;
        
        if (!apiKey) {
            throw new Error('Chưa cấu hình OpenAI API key');
        }
        
        // Prepare the prompt for AI
        const prompt = `Bạn là một trợ lý AI chuyên giúp trả lời câu hỏi. Hãy phân tích câu hỏi sau và đưa ra đáp án chính xác, chi tiết:

Câu hỏi: ${questionText}

Yêu cầu:
1. Đọc kỹ câu hỏi và xác định loại câu hỏi (trắc nghiệm, tự luận, toán học, v.v.)
2. Nếu là câu hỏi trắc nghiệm, hãy phân tích từng đáp án và chọn đáp án đúng nhất
3. Giải thích lý do tại sao chọn đáp án đó
4. Nếu cần thiết, cung cấp công thức hoặc phương pháp giải
5. Trả lời bằng tiếng Việt

Đáp án:`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là một trợ lý AI chuyên giúp trả lời câu hỏi học thuật. Hãy trả lời chính xác, chi tiết và dễ hiểu.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const answer = data.choices[0].message.content;
        
        // Send result to popup
        chrome.runtime.sendMessage({
            action: 'analysisComplete',
            success: true,
            result: answer
        });
        
    } catch (error) {
        console.error('AI Processing Error:', error);
        chrome.runtime.sendMessage({
            action: 'analysisComplete',
            success: false,
            error: error.message
        });
    }
}

// Helper function to convert data URL to File object
function dataURLtoFile(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], 'screenshot.png', { type: mime });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            openaiKey: '',
            ocrLanguage: 'eng'
        });
    }
});

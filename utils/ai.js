// AI utility functions for the extension
class AIHelper {
    constructor() {
        this.apiKey = null;
        this.model = 'gpt-3.5-turbo';
    }

    async initialize() {
        const result = await chrome.storage.sync.get(['openaiKey']);
        this.apiKey = result.openaiKey;
        return !!this.apiKey;
    }

    async analyzeQuestion(questionText, questionType = 'general') {
        if (!this.apiKey) {
            throw new Error('OpenAI API key chưa được cấu hình');
        }

        const prompt = this.buildPrompt(questionText, questionType);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt(questionType)
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('AI Analysis Error:', error);
            throw error;
        }
    }

    buildPrompt(questionText, questionType) {
        const basePrompt = `Hãy phân tích câu hỏi sau và đưa ra đáp án chính xác:

Câu hỏi: ${questionText}

Yêu cầu:`;

        switch (questionType) {
            case 'multiple_choice':
                return basePrompt + `
1. Đọc kỹ câu hỏi và các đáp án
2. Phân tích từng đáp án một cách chi tiết
3. Chọn đáp án đúng nhất và giải thích lý do
4. Nếu có thể, cung cấp thêm thông tin bổ sung
5. Trả lời bằng tiếng Việt, rõ ràng và dễ hiểu`;

            case 'math':
                return basePrompt + `
1. Xác định loại bài toán (đại số, hình học, giải tích, v.v.)
2. Trình bày các bước giải chi tiết
3. Áp dụng công thức phù hợp
4. Kiểm tra kết quả
5. Trả lời bằng tiếng Việt với công thức rõ ràng`;

            case 'essay':
                return basePrompt + `
1. Phân tích yêu cầu của câu hỏi
2. Lập dàn ý chi tiết
3. Trình bày luận điểm chính
4. Cung cấp ví dụ minh họa
5. Kết luận tổng hợp
6. Trả lời bằng tiếng Việt, có cấu trúc rõ ràng`;

            default:
                return basePrompt + `
1. Đọc kỹ câu hỏi và xác định chủ đề
2. Cung cấp thông tin chính xác và đầy đủ
3. Giải thích rõ ràng, dễ hiểu
4. Cung cấp ví dụ minh họa nếu cần
5. Trả lời bằng tiếng Việt`;

        }
    }

    getSystemPrompt(questionType) {
        const baseSystem = 'Bạn là một trợ lý AI chuyên giúp trả lời câu hỏi học thuật. Hãy trả lời chính xác, chi tiết và dễ hiểu.';

        switch (questionType) {
            case 'multiple_choice':
                return baseSystem + ' Đặc biệt chú ý đến việc phân tích các lựa chọn và chọn đáp án đúng nhất.';
            
            case 'math':
                return baseSystem + ' Trình bày các bước giải toán một cách chi tiết và rõ ràng.';
            
            case 'essay':
                return baseSystem + ' Cấu trúc câu trả lời như một bài luận hoàn chỉnh.';
            
            default:
                return baseSystem;
        }
    }

    detectQuestionType(questionText) {
        const text = questionText.toLowerCase();
        
        // Check for multiple choice indicators
        if (text.includes('chọn') || text.includes('đáp án') || 
            text.match(/[a-d]\)/) || text.match(/[1-4]\)/)) {
            return 'multiple_choice';
        }
        
        // Check for math indicators
        if (text.includes('tính') || text.includes('giải') || 
            text.match(/[+\-*/=]/) || text.includes('phương trình') ||
            text.includes('công thức')) {
            return 'math';
        }
        
        // Check for essay indicators
        if (text.includes('trình bày') || text.includes('phân tích') ||
            text.includes('giải thích') || text.includes('so sánh') ||
            text.includes('bình luận')) {
            return 'essay';
        }
        
        return 'general';
    }

    async processQuestion(questionText) {
        try {
            const questionType = this.detectQuestionType(questionText);
            const answer = await this.analyzeQuestion(questionText, questionType);
            
            return {
                success: true,
                questionType: questionType,
                answer: answer,
                originalQuestion: questionText
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                originalQuestion: questionText
            };
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIHelper;
} else {
    window.AIHelper = AIHelper;
}

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// Track API usage
let usageStats = {
    totalTokens: 0,
    totalCalls: 0,
    estimatedCost: 0 // in RMB
};

async function chat(messages, options = {}) {
    try {
        const res = await axios.post(API_URL, {
            model: MODEL,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const usage = res.data.usage;
        if (usage) {
            usageStats.totalTokens += usage.total_tokens;
            usageStats.totalCalls++;
            // DeepSeek pricing: ~1 RMB per 1M tokens (varies by model)
            usageStats.estimatedCost += (usage.total_tokens / 1000000) * 1;
        }

        return {
            content: res.data.choices[0].message.content,
            usage: usage
        };
    } catch (e) {
        console.error('DeepSeek API error:', e.response?.data || e.message);
        throw new Error(e.response?.data?.error?.message || e.message);
    }
}

// Pre-defined prompt templates
const PROMPTS = {
    xiaohongshu: (topic) => [
        { role: 'system', content: '你是一个小红书爆款文案写作专家。请写一篇吸引人的小红书风格笔记，包含：吸引眼球的标题、emoji表情、分段清晰的内容、relevant标签。语言活泼亲切，有个人风格。' },
        { role: 'user', content: `请写一篇关于"${topic}"的小红书笔记` }
    ],
    product_desc: (product) => [
        { role: 'system', content: '你是一个电商文案专家。写产品描述要突出卖点、解决用户痛点、包含使用场景。语言简洁有力。' },
        { role: 'user', content: `请为"${product}"写一段电商产品描述` }
    ],
    article: (topic) => [
        { role: 'system', content: '你是一个专业文章写手。写一篇结构清晰、内容充实的公众号风格文章。要有引人入胜的开头、分点论述、总结升华。' },
        { role: 'user', content: `请写一篇关于"${topic}"的公众号文章` }
    ],
    short_video: (topic) => [
        { role: 'system', content: '你是一个短视频脚本专家。写15-60秒的短视频脚本，包含：开场hook、主要内容、结尾引导互动。标注镜头和动作。' },
        { role: 'user', content: `请写一个关于"${topic}"的短视频脚本` }
    ],
    seo_article: (keyword) => [
        { role: 'system', content: '你是一个SEO内容专家。写一篇搜索引擎优化的文章，自然融入关键词，结构清晰，有价值内容。' },
        { role: 'user', content: `请写一篇围绕关键词"${keyword}"的SEO优化文章` }
    ],
    translate: (text, targetLang) => [
        { role: 'system', content: `你是一个专业翻译。将文本翻译成${targetLang}，保持原意和语气，自然流畅。` },
        { role: 'user', content: text }
    ],
    custom: (prompt) => [
        { role: 'system', content: '你是一个AI助手，请根据用户的要求完成创作。' },
        { role: 'user', content: prompt }
    ]
};

function getUsage() {
    return { ...usageStats };
}

module.exports = { chat, PROMPTS, getUsage };



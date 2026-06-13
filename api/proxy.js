// Vercel Serverless Function - DeepSeek API Proxy
// API密钥存在 Vercel Environment Variables 中，不暴露给前端
const axios = require("axios");

module.exports = async (req, res) => {
    // 只允许POST请求
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = req.body;
    if (!messages) {
        return res.status(400).json({ error: "Missing messages" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
    }

    try {
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
                messages: messages,
                max_tokens: 4096,
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": "Bearer " + apiKey,
                    "Content-Type": "application/json"
                },
                timeout: 60000
            }
        );

        return res.json({
            content: response.data.choices[0].message.content,
            usage: response.data.usage
        });
    } catch (error) {
        console.error("Proxy error:", error.message);
        return res.status(500).json({
            error: error.response?.data?.error?.message || error.message
        });
    }
};

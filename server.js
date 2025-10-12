const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

app.post('/api/solve', async (req, res) => {
    const { questionText } = req.body;
    const API_KEY = process.env.API_KEY;
    const MODEL_NAME = 'gemini-2.5-flash';
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not found.' });
    }

    const prompt = `You are an expert assignment solver. The user has provided a question.
    Your primary goal is to provide only the code and the output, without any explanation.
    Provide the final, runnable code under a "## Solution" heading.
    Provide the output of the code under a "## Output" heading.
    Do not provide any explanation unless the user explicitly asks for it.
    Format your entire answer strictly using Markdown.
    User Question: "${questionText}"`;

    try {
        const response = await axios.post(API_ENDPOINT, {
            contents: [{ parts: [{ text: prompt }] }]
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({ error: 'Failed to get response from AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

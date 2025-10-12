const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.post('/api/solve', async (req, res) => {
    const { questionText } = req.body;
    const API_KEY = process.env.API_KEY;
    const MODEL_NAME = 'gemini-2.5-flash';
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not found.' });
    }

    const prompt = `You are an expert assignment solver. Your task is to provide a direct solution to the user's coding question.
    Provide only the following two things:
    1.  The complete, runnable code solution. The code should not contain any comments.
    2.  The output of the code.

    Structure your response with a "## Code" heading for the code and a "## Output" heading for the output.
    Do not provide any explanation, logic, or any other text besides the code and the output.
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

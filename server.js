const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const RAPIDAPI_KEY = process.env.ONECOMPILER_API_KEY; 
const RAPIDAPI_HOST = 'onecompiler-apis.p.rapidapi.com';
const API_ENDPOINT_ONECOMPILER = 'https://onecompiler-apis.p.rapidapi.com/api/v1/run';

app.use(cors());
app.use(express.json({ limit: '5mb' }));
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

    const prompt = `User Question: "${questionText}"`;

    try {
        const response = await axios.post(API_ENDPOINT, {
            contents: [{ parts: [{ text: prompt }] }]
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get response from AI.' });
    }
});

// ----------------------------------------------------------------------
// 1. RUN CODE ENDPOINT (Handles Python, Java, C++, etc.)
// ----------------------------------------------------------------------
app.post('/api/run-code', async (req, res) => {
    try {
        const payload = req.body;

        // Use Axios to securely call the external OneCompiler API
        const apiResponse = await axios.post(API_ENDPOINT_ONECOMPILER, payload, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
                'Content-Type': 'application/json'
            }
        });

        // Forward the API result (stdout, stderr, etc.) back to the browser
        res.json(apiResponse.data);

    } catch (error) {
        console.error('Proxy Error:', error);

        // If the error has a response object (e.g., a 403 from RapidAPI), return that status
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }

        // General server error
        res.status(500).json({ error: 'Internal Server Error during code execution.' });
    }
});

// ----------------------------------------------------------------------
// 2. SCREENSHOT ENDPOINT (Handles HTML/Web Page Capture using Puppeteer)
// ----------------------------------------------------------------------
app.post('/api/capture-screenshot', async (req, res) => {
    console.log('[CAPTURE] Received request for screenshot.');
    console.log('[CAPTURE] Request body:', req.body);
    const { url } = req.body;
    console.log('[CAPTURE] Extracted URL:', url);
    if (!url) { return res.status(400).json({ error: 'Missing URL parameter.' }); }

    let browser;
    console.log(`[CAPTURE] Attempting screenshot for URL: ${url}`);
    
    try {
        // Launch a headless Chromium browser instance
        browser = await puppeteer.launch({
            headless: true, // Use new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended args for Puppeteer
        });
        console.log('[CAPTURE] Browser launched successfully.'); 

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 }); 
        
        // Navigate to the OneCompiler-provided URL
        await page.goto(url, { 
            waitUntil: 'networkidle0', // Wait until the page is fully idle
            timeout: 90000 
        });
        console.log('[CAPTURE] Page navigated successfully.'); 

        // Take a screenshot of the entire rendered page
        const screenshotBuffer = await page.screenshot({
            fullPage: true, 
            type: 'png'
        });
        console.log('[CAPTURE] Screenshot captured.'); 

        // Convert the image data to Base64 for transfer back to the client
        const base64Image = screenshotBuffer.toString('base64');
        res.json({ image: base64Image });

    } catch (error) {
        // This catch block handles the silent launch errors we've been debugging
        console.error('--- FATAL PUPPETEER ERROR ---');
        console.error('Error Details:', error.message);
        res.status(500).json({ error: 'Screenshot Failed on Server. Check Node.js console for detail.' });
    } finally {
        if (browser) {
            await browser.close();
        }
        console.log('[CAPTURE] Browser closed.');
    }
});


const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
server.timeout = 300000; // 5 minutes timeout
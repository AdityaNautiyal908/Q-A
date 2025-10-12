# Gemini Q&A - AI Assignment Solver

A web-based application that uses the Google Gemini API to answer questions and solve assignments. It's designed to help students and developers get quick solutions to their problems, especially for coding assignments.

## Features

- **AI-Powered Solutions:** Get instant answers to your questions from the Gemini API.
- **Sequential Q&A:** Ask multiple questions in a row and build a full assignment.
- **Multi-Question Input:** Paste a list of questions and get solutions for all of them sequentially.
- **Word Export:** Download your entire session as a formatted Microsoft Word document.
- **Code-Focused:** The AI is instructed to provide code-only answers by default for technical questions.
- **Copy to Clipboard:** Easily copy code blocks with a single click.
- **Light/Dark Mode:** Toggle between light and dark themes for your comfort.
- **Session Persistence:** Your question and answer history is saved in your browser, so you won't lose your work on refresh.
- **Animated Splash Screen:** A simple and elegant opening animation.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **API:** Google Gemini API
- **Libraries:**
    - `marked.js` for Markdown to HTML conversion.
    - `highlight.js` for syntax highlighting.
    - `FileSaver.js` for saving the Word document.
    - `axios` for making API requests from the server.
    - `dotenv` for managing environment variables.

## Setup and Installation

1.  **Clone the repository (or download the files).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    -   In the root of the project, create a file named `.env`.
    -   Add your Gemini API key to this file:
        ```
        API_KEY=YOUR_GEMINI_API_KEY
        ```
4.  **Start the server:**
    ```bash
    node server.js
    ```
5.  **Open the application:**
    -   Open your browser and go to `http://localhost:3000`.

## Usage

-   Type a single question or paste a list of questions (one per line) into the text area.
-   Click the "Get Solution" button.
-   The solutions will appear on the page one by one.
-   Use the "Download Solution" button to get a Word document of the entire session.
-   Use the "Clear Session" button to start a new assignment.
-   Use the toggle in the navigation bar to switch between light and dark modes.
-   Use the "Copy" button on code blocks to copy the code.

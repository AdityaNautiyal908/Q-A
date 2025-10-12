window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splash-screen');
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 1000);
    }, 2000);

    loadSession();
});

const themeSwitch = document.getElementById('checkbox');
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('light-mode');
});

let conversationHistory = [];
let practicalCount = 0;

function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('.markdown-body pre');
    codeBlocks.forEach(block => {
        const button = document.createElement('button');
        button.innerText = 'Copy';
        button.className = 'copy-button';

        button.addEventListener('click', () => {
            const code = block.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerText = 'Copied!';
                setTimeout(() => {
                    button.innerText = 'Copy';
                }, 2000);
            });
        });

        block.prepend(button);
    });
}

function saveSession() {
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
}

function loadSession() {
    const savedHistory = localStorage.getItem('conversationHistory');
    if (savedHistory) {
        conversationHistory = JSON.parse(savedHistory);
        practicalCount = conversationHistory.length;
        renderHistory();
    }
}

function renderHistory() {
    const outputElement = document.getElementById('solution-output');
    outputElement.innerHTML = '';
    conversationHistory.forEach(practical => {
        const practicalContainer = document.createElement('div');
        const htmlSolution = marked.parse(practical.solution);
        practicalContainer.innerHTML = `<h2>Practical No: ${practical.practicalNo}</h2><p>${practical.question}</p>${htmlSolution}`;
        outputElement.appendChild(practicalContainer);
    });
    hljs.highlightAll();
    addCopyButtons();
    if (conversationHistory.length > 0) {
        document.getElementById('convert-to-word').style.display = 'block';
        document.getElementById('clear-button').style.display = 'block';
    }
}

document.getElementById('solve-button').addEventListener('click', async () => {
    const allQuestionsText = document.getElementById('question-input').value;
    const outputElement = document.getElementById('solution-output');
    const wordButton = document.getElementById('convert-to-word');

    if (!allQuestionsText.trim()) {
        outputElement.innerHTML = '<p style="color: red;">Please enter a question to solve.</p>';
        return;
    }

    const questions = allQuestionsText.split('\n').filter(q => q.trim() !== '');

    if (questions.length === 0) {
        return;
    }

    if (practicalCount === 0) {
        outputElement.innerHTML = '';
    }

    for (const questionText of questions) {
        const loaderId = `loader-${practicalCount}`;
        const practicalContainer = document.createElement('div');
        practicalContainer.innerHTML = `<h2>Practical No: ${practicalCount + 1}</h2><div class="loader" id="${loaderId}"></div>`;
        outputElement.appendChild(practicalContainer);

        try {
            const response = await fetch('/api/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error}`);
            }

            const data = await response.json();
            const solutionText = data.candidates[0].content.parts[0].text;

            const newPractical = {
                question: questionText,
                solution: solutionText,
                practicalNo: practicalCount + 1
            };
            conversationHistory.push(newPractical);
            saveSession();

            const htmlSolution = marked.parse(solutionText);
            practicalContainer.innerHTML = `<h2>Practical No: ${newPractical.practicalNo}</h2><p>${newPractical.question}</p>${htmlSolution}`;
            hljs.highlightAll();
            addCopyButtons();

            practicalCount++;
            wordButton.style.display = 'block';
            document.getElementById('clear-button').style.display = 'block';

        } catch (error) {
            practicalContainer.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
            console.error("Fetch Error:", error);
        }
    }
});

document.getElementById('clear-button').addEventListener('click', () => {
    conversationHistory = [];
    practicalCount = 0;
    localStorage.removeItem('conversationHistory');
    document.getElementById('solution-output').innerHTML = '<p>Your solution will appear here. The more detailed your question, the better the answer.</p>';
    document.getElementById('convert-to-word').style.display = 'none';
    document.getElementById('clear-button').style.display = 'none';
});


// --- WORD DOWNLOAD FUNCTIONALITY ---

document.getElementById('convert-to-word').addEventListener('click', () => {
    if (conversationHistory.length === 0) {
        alert("Please generate a solution first.");
        return;
    }

    let allPracticalsHtml = '';
    conversationHistory.forEach(practical => {
        allPracticalsHtml += `
            <div style="page-break-after: always;">
                <p style="font-size: 16pt;">
                    <b>Practical No: ${practical.practicalNo}</b> - <span style="font-weight: normal; font-size: 12pt;">${practical.question}</span>
                </p>
                ${marked.parse(practical.solution)}
            </div>
        `;
    });

    let content = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>Assignment Solution</title>
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                * {
                    font-family: 'Times New Roman', Times, serif;
                }
                h2 { color: #333; }
                pre, code {
                    font-family: 'Times New Roman', Times, serif;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            ${allPracticalsHtml}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword;charset=utf-8'
    });

    saveAs(blob, `Full_Assignment_Solution.doc`); 
});
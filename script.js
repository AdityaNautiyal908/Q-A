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
        if (block.querySelector('.copy-button')) return;
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
    conversationHistory.forEach((practical, index) => {
        const practicalContainer = document.createElement('div');
        practicalContainer.id = `practical-${index}`;
        const htmlSolution = marked.parse(practical.solution);
        const editButton = `<button class="edit-button" onclick="openEditModal(${index})">Edit</button>`;
        const deleteButton = `<button class="delete-button" onclick="deletePractical(${index})">Delete</button>`;
        practicalContainer.innerHTML = `<h2>Practical No: ${practical.practicalNo}${editButton}${deleteButton}</h2><p>${practical.question}</p><div class="solution-text-container">${htmlSolution}</div>`;
        outputElement.appendChild(practicalContainer);
    });
    hljs.highlightAll();
    addCopyButtons();
    if (conversationHistory.length > 0) {
        document.getElementById('convert-to-word').style.display = 'block';
        document.getElementById('clear-button').style.display = 'block';
        document.getElementById('export-button').style.display = 'block';
    } else {
        document.getElementById('convert-to-word').style.display = 'none';
        document.getElementById('clear-button').style.display = 'none';
        document.getElementById('export-button').style.display = 'none';
    }
}

function deletePractical(index) {
    conversationHistory.splice(index, 1);
    conversationHistory.forEach((practical, i) => {
        practical.practicalNo = i + 1;
    });
    practicalCount = conversationHistory.length;
    saveSession();
    renderHistory();
}

function openEditModal(index) {
    const modal = document.getElementById('edit-modal');
    const textarea = document.getElementById('edit-textarea');
    const saveButton = document.getElementById('save-edit-button');

    textarea.value = conversationHistory[index].question;
    modal.style.display = 'block';

    saveButton.onclick = () => {
        rerunQuestion(index, textarea.value);
        modal.style.display = 'none';
    };
}

async function rerunQuestion(index, newQuestion) {
    conversationHistory[index].question = newQuestion;

    const practicalContainer = document.getElementById(`practical-${index}`);
    let solutionContainer = practicalContainer.querySelector('.solution-text-container');
    if (!solutionContainer) {
        solutionContainer = document.createElement('div');
        solutionContainer.className = 'solution-text-container';
        practicalContainer.appendChild(solutionContainer);
    }
    
    practicalContainer.innerHTML = `<h2>Practical No: ${conversationHistory[index].practicalNo}<button class="edit-button" onclick="openEditModal(${index})">Edit</button><button class="delete-button" onclick="deletePractical(${index})">Delete</button></h2><p>${newQuestion}</p>`;
    practicalContainer.appendChild(solutionContainer);
    solutionContainer.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionText: newQuestion })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error}`);
        }

        const data = await response.json();
        const solutionText = data.candidates[0].content.parts[0].text;

        solutionContainer.innerHTML = marked.parse(solutionText);
        conversationHistory[index].solution = solutionText;
        saveSession();
        hljs.highlightAll();
        addCopyButtons();

    } catch (error) {
        solutionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
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

    if (questions.length === 0) return;

    if (practicalCount === 0) {
        outputElement.innerHTML = '';
    }

    for (const questionText of questions) {
        const currentPracticalNo = practicalCount + 1;
        const practicalContainer = document.createElement('div');
        practicalContainer.id = `practical-${practicalCount}`;
        const solutionContainer = document.createElement('div');
        solutionContainer.className = 'solution-text-container';
        practicalContainer.innerHTML = `<h2>Practical No: ${currentPracticalNo}<button class="edit-button" onclick="openEditModal(${practicalCount})">Edit</button><button class="delete-button" onclick="deletePractical(${practicalCount})">Delete</button></h2><p>${questionText}</p>`;
        practicalContainer.appendChild(solutionContainer);
        outputElement.appendChild(practicalContainer);
        solutionContainer.innerHTML = '<div class="loader"></div>';

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

            solutionContainer.innerHTML = marked.parse(solutionText);

            const newPractical = {
                question: questionText,
                solution: solutionText,
                practicalNo: currentPracticalNo
            };
            conversationHistory.push(newPractical);
            saveSession();

            hljs.highlightAll();
            addCopyButtons();

            practicalCount++;
            wordButton.style.display = 'block';
            document.getElementById('clear-button').style.display = 'block';
            document.getElementById('export-button').style.display = 'block';

        } catch (error) {
            solutionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
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
    document.getElementById('export-button').style.display = 'none';
});

document.getElementById('export-button').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(conversationHistory, null, 2)], { type: 'application/json' });
    saveAs(blob, 'session.json');
});

document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedHistory = JSON.parse(e.target.result);
            if (Array.isArray(importedHistory)) {
                conversationHistory = importedHistory;
                practicalCount = conversationHistory.length;
                saveSession();
                renderHistory();
            } else {
                alert('Invalid session file.');
            }
        } catch (err) {
            alert('Error reading session file.');
        }
    };
    reader.readAsText(file);
});

function getDownloadContent() {
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

    return `
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
}

function downloadAsWord() {
    const content = getDownloadContent();
    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword;charset=utf-8'
    });
    saveAs(blob, `Full_Assignment_Solution.doc`);
}

function downloadAsPdf() {
    const content = getDownloadContent();
    const options = {
        margin: 1,
        filename: 'Full_Assignment_Solution.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(content).set(options).save();
}

document.getElementById('convert-to-word').addEventListener('click', () => {
    if (conversationHistory.length === 0) {
        alert("Please generate a solution first.");
        return;
    }

    Swal.fire({
        title: 'Select Download Format',
        input: 'select',
        inputOptions: {
            'word': 'Word (.doc)',
            'pdf': 'PDF (.pdf)'
        },
        inputPlaceholder: 'Select a format',
        showCancelButton: true,
        confirmButtonText: 'Download',
    }).then((result) => {
        if (result.isConfirmed) {
            if (result.value === 'word') {
                downloadAsWord();
            } else if (result.value === 'pdf') {
                downloadAsPdf();
            }
        }
    });
});

const modal = document.getElementById('edit-modal');
const closeButton = document.querySelector('.close-button');
closeButton.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };
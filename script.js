window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splash-screen');
    const splashContent = document.querySelector('.splash-content');

    const tl = gsap.timeline();

    tl.from(splashContent, {
        scale: 0.2,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    }).to(splashContent, {
        scale: 1.5,
        duration: 1,
        ease: "power2.inOut"
    }).to(splashContent, {
        scaleY: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in"
    }).to(splashScreen, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            splashScreen.style.display = 'none';
        }
    });

    mermaid.initialize({ startOnLoad: false });
    loadSession();
});

const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', (e) => {
    const isLight = document.body.classList.contains('light-mode');
    
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            document.body.classList.toggle('light-mode');
        });
    } else {
        document.body.classList.toggle('light-mode');
    }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micButton = document.getElementById('mic-button');
const questionInput = document.getElementById('question-input');

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    micButton.addEventListener('click', () => {
        if (micButton.classList.contains('is-listening')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    recognition.onstart = () => {
        micButton.classList.add('is-listening');
    };

    recognition.onend = () => {
        micButton.classList.remove('is-listening');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        questionInput.value = finalTranscript + interimTranscript;
    };

} else {
    micButton.style.display = 'none';
    console.log('Speech Recognition not supported');
}

let conversationHistory = [];
let practicalCount = 0;
let activeReadAloudButton = null;

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

function addReadAloudButtons() {
    const solutionContainers = document.querySelectorAll('.solution-text-container');
    solutionContainers.forEach((container, index) => {
        if (container.querySelector('.read-aloud-button')) return;
        const button = document.createElement('button');
        button.innerText = 'Read Aloud';
        button.className = 'read-aloud-button';

        button.addEventListener('click', () => {
            const wasActive = (activeReadAloudButton === button);

            speechSynthesis.cancel();
            if (activeReadAloudButton) {
                activeReadAloudButton.innerText = 'Read Aloud';
            }
            activeReadAloudButton = null;

            if (!wasActive) {
                const text = conversationHistory[index].solution;
                const utterance = new SpeechSynthesisUtterance(text);

                utterance.onend = () => {
                    if (activeReadAloudButton === button) {
                        button.innerText = 'Read Aloud';
                        activeReadAloudButton = null;
                    }
                };

                speechSynthesis.speak(utterance);
                button.innerText = 'Stop';
                activeReadAloudButton = button;
            }
        });

        container.prepend(button);
    });
}

function renderMermaidDiagrams() {
    const mermaidElements = document.querySelectorAll('pre code.language-mermaid');
    mermaidElements.forEach((element, index) => {
        const id = `mermaid-diagram-${Date.now()}-${index}`;
        const mermaidCode = element.textContent;
        
        mermaid.render(id, mermaidCode, (svgCode) => {
            const preElement = element.parentElement;
            const diagramContainer = document.createElement('div');
            diagramContainer.innerHTML = svgCode;
            preElement.parentNode.replaceChild(diagramContainer, preElement);
        });
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
        const readAloudButton = `<button class="read-aloud-button" onclick="readAloud(${index})">Read Aloud</button>`;
        const editSolutionButton = `<button class="edit-button" onclick="openEditSolutionModal(${index})">Edit Solution</button>`;
        practicalContainer.innerHTML = `<h2>Practical No: ${practical.practicalNo}${editButton}${deleteButton}${readAloudButton}${editSolutionButton}</h2><p>${practical.question}</p><div class="solution-text-container">${htmlSolution}</div>`;
        outputElement.appendChild(practicalContainer);
    });
    hljs.highlightAll();
    addCopyButtons();
    addReadAloudButtons();
    renderMermaidDiagrams();
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
    const modalTitle = modal.querySelector('h2');
    const textarea = document.getElementById('edit-textarea');
    const saveButton = document.getElementById('save-edit-button');

    modalTitle.innerText = 'Edit Question';
    textarea.value = conversationHistory[index].question;
    modal.style.display = 'block';

    saveButton.onclick = () => {
        rerunQuestion(index, textarea.value);
        modal.style.display = 'none';
    };
}

function openEditSolutionModal(index) {
    const modal = document.getElementById('edit-modal');
    const modalTitle = modal.querySelector('h2');
    const textarea = document.getElementById('edit-textarea');
    const saveButton = document.getElementById('save-edit-button');

    modalTitle.innerText = 'Edit Solution';
    textarea.value = conversationHistory[index].solution;
    modal.style.display = 'block';

    saveButton.onclick = () => {
        saveEditedSolution(index, textarea.value);
        modal.style.display = 'none';
    };
}

function saveEditedSolution(index, newSolution) {
    conversationHistory[index].solution = newSolution;
    saveSession();
    renderHistory();
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
    
    practicalContainer.innerHTML = `<h2>Practical No: ${conversationHistory[index].practicalNo}<button class="edit-button" onclick="openEditModal(${index})">Edit</button><button class="delete-button" onclick="deletePractical(${index})">Delete</button><button class="edit-button" onclick="openEditSolutionModal(${index})">Edit Solution</button></h2><p>${newQuestion}</p>`;
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
        addReadAloudButtons();
        renderMermaidDiagrams();

    } catch (error) {
        solutionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

document.getElementById('solve-button').addEventListener('click', async () => {
    const allQuestionsText = document.getElementById('question-input').value;
    const outputElement = document.getElementById('solution-output');
    const wordButton = document.getElementById('convert-to-word');
    const imageUpload = document.getElementById('image-upload');

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
        practicalContainer.innerHTML = `<h2>Practical No: ${currentPracticalNo}<button class="edit-button" onclick="openEditModal(${practicalCount})">Edit</button><button class="delete-button" onclick="deletePractical(${currentPracticalNo - 1})">Delete</button><button class="edit-button" onclick="openEditSolutionModal(${practicalCount})">Edit Solution</button></h2><p>${questionText}</p>`;
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
            addReadAloudButtons();
            renderMermaidDiagrams();

            practicalCount++;
            wordButton.style.display = 'block';
            document.getElementById('clear-button').style.display = 'block';
            document.getElementById('export-button').style.display = 'block';

        } catch (error) {
            solutionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            console.error("Fetch Error:", error);
        }
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'success',
        title: 'Solution Ready!',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
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
    conversationHistory.forEach((practical, index) => {
        allPracticalsHtml += `
            <div class="${index > 0 ? 'html2pdf__page-break' : ''}">
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
                    color: black;
                }
                * {
                    font-family: 'Times New Roman', Times, serif;
                    color: black;
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
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all', before: '.html2pdf__page-break' } // Use html2pdf.js specific page break
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
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
            if (!localStorage.getItem('hasVisited')) {
                startTour();
            }
        }
    });

    mermaid.initialize({ startOnLoad: false });
    loadSession();
});

const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', (e) => {
    const isLight = document.body.classList.contains('light-mode');
    
    const x = e.clientX;
    const y = e.clientY;

    document.documentElement.style.setProperty('--x', x + 'px');
    document.documentElement.style.setProperty('--y', y + 'px');

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
    const codeBlocks = document.querySelectorAll('.solution-text-container pre');
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
        practicalContainer.innerHTML = `<h2>Practical No: ${practical.practicalNo}${editButton}${deleteButton}${readAloudButton}${editSolutionButton}</h2><p>${practical.question}</p><div class="solution-text-container markdown-body">${htmlSolution}</div>`;
        outputElement.appendChild(practicalContainer);
    });
    hljs.highlightAll();
    addCopyButtons();
    addReadAloudButtons();
    addRunCodeButtons();
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
        solutionContainer.className = 'solution-text-container markdown-body';
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
        addRunCodeButtons();
        renderMermaidDiagrams();

    } catch (error) {
        solutionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

const scrollToSolutionButton = document.getElementById('scroll-to-solution-button');
const scrollToTopButton = document.getElementById('scroll-to-top-button');
let latestSolutionId = null;

document.getElementById('solve-button').addEventListener('click', async () => {
    const solveButton = document.getElementById('solve-button');
    const allQuestionsText = document.getElementById('question-input').value;
    const outputElement = document.getElementById('solution-output');
    const wordButton = document.getElementById('convert-to-word');
    const imageUpload = document.getElementById('image-upload');

    if (!allQuestionsText.trim()) {
        outputElement.innerHTML = '<p style="color: red;">Please enter a question to solve.</p>';
        return;
    }

    solveButton.disabled = true;
    solveButton.innerHTML = '<div class="loader-small"></div> Generating...';

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
        solutionContainer.className = 'solution-text-container markdown-body';
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
            addRunCodeButtons();
            renderMermaidDiagrams();

            practicalCount++;
            wordButton.style.display = 'block';
            document.getElementById('clear-button').style.display = 'block';
            document.getElementById('export-button').style.display = 'block';

            latestSolutionId = `practical-${practicalCount - 1}`;
            scrollToSolutionButton.style.display = 'flex';

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

    document.getElementById('question-input').value = '';
    solveButton.disabled = false;
    solveButton.innerHTML = 'Get Solution';
});

scrollToSolutionButton.addEventListener('click', () => {
    if (latestSolutionId) {
        const element = document.getElementById(latestSolutionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    scrollToSolutionButton.style.display = 'none';
});

scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

window.addEventListener('scroll', () => {
    if (scrollToSolutionButton.style.display === 'flex') {
        scrollToSolutionButton.style.display = 'none';
    }

    if (window.scrollY > 200) {
        scrollToTopButton.style.display = 'flex';
    } else {
        scrollToTopButton.style.display = 'none';
    }
}, { passive: true });

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

function addRunCodeButtons() {
    const codeBlocks = document.querySelectorAll('.solution-text-container pre');
    codeBlocks.forEach((block, index) => {
        if (block.nextElementSibling && block.nextElementSibling.classList.contains('code-input-container')) return;

        const inputContainer = document.createElement('div');
        inputContainer.className = 'code-input-container';

        const inputHeader = document.createElement('div');
        inputHeader.className = 'code-input-header';
        
        const inputLabel = document.createElement('label');
        inputLabel.innerText = 'Program Input:';

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.className = 'delete-input-button';

        inputHeader.appendChild(inputLabel);
        inputHeader.appendChild(deleteButton);
        
        const inputArea = document.createElement('textarea');
        inputArea.className = 'code-input-area';
        inputArea.rows = 2;
        inputArea.placeholder = 'Enter any required input for the code here, with each value on a new line.';

        deleteButton.addEventListener('click', () => {
            inputArea.value = '';
        });
        
        inputContainer.appendChild(inputHeader);
        inputContainer.appendChild(inputArea);

        const runButton = document.createElement('button');
        runButton.innerText = 'Run Code';
        runButton.className = 'run-code-button';
        runButton.onclick = (event) => runCode(block, index, inputArea.value, event.target); // Pass the button

        const outputContainer = document.createElement('div');
        outputContainer.className = 'code-output-container';
        outputContainer.id = `code-output-${index}`;

        const imagePreviewContainer = document.createElement('div');
        imagePreviewContainer.className = 'image-preview-container';
        imagePreviewContainer.id = `image-preview-container-${index}`;

        block.after(inputContainer);
        inputContainer.after(runButton);
        runButton.after(outputContainer);
        outputContainer.after(imagePreviewContainer);
    });
}

async function runCode(block, index, stdin, runButtonElement) { // Added runButtonElement
    const code = block.querySelector('code').innerText;
    const language = guessLanguageFromCode(code);
    
    const outputContainer = document.getElementById(`code-output-${index}`);
    outputContainer.innerHTML = '<div class="loader"></div>';

    try {
        const extension = {
            "python": ".py",
            "javascript": ".js",
            "java": ".java",
            "c": ".c",
            "cpp": ".cpp",
            "csharp": ".cs",
            "html": ".html"
        }[language] || '.txt';
        let files = (language === 'html') ? extractWebFiles(code) : [{ name: `main${extension}`, content: code }];

        const payload = { language: language, stdin: stdin, files: files };

        const response = await fetch('/api/run-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Proxy Error: Server returned status ${response.status}`);
        }

        const result = await response.json();
        
        if (language === 'html') {
            const outputUrl = result.stdout;
            if (outputUrl) {
                outputContainer.innerHTML = `<iframe src="${outputUrl}" style="width: 100%; height: 300px; border: none;"></iframe>`;
                addCaptureButton(outputContainer, outputUrl, index, runButtonElement); // Pass element
            } else {
                 outputContainer.innerHTML = `<p style="color: red;">ERROR: Failed to render HTML. Check if it's valid: ${result.stderr || result.exception}</p>`;
            }
        } else if (result.exception || result.stderr) {
            outputContainer.textContent = `ERROR:\n${result.stderr || result.exception}`;
        } else {
            outputContainer.textContent = result.stdout;
            addCaptureButton(outputContainer, null, index, runButtonElement); // Pass element
        }

    } catch (error) {
        console.error("Code Execution Failed:", error);
        outputContainer.textContent = `CONNECTION FAILED. Ensure 'server.js' is running on port 3000.`;
    }
}

function addCaptureButton(outputContainer, url, index, runButtonElement) { // Added runButtonElement
    // Check if the button already exists for this code block
    if (document.getElementById(`capture-btn-${index}`)) {
        return;
    }

    const captureButton = document.createElement('button');
    captureButton.innerText = 'Generate Output Image';
    captureButton.className = 'capture-output-button';
    captureButton.id = `capture-btn-${index}`; // Add ID to prevent duplicates
    captureButton.onclick = () => captureOutput(outputContainer, url, index);
    
    // Insert the capture button next to the run button
    runButtonElement.after(captureButton);
}

async function captureOutput(outputContainer, url, index) {
    const imagePreviewContainer = document.getElementById(`image-preview-container-${index}`);
    imagePreviewContainer.innerHTML = '<div class="loader"></div>';

    try {
        if (url) {
            // --- SERVER-SIDE CAPTURE (for HTML) ---
            const response = await fetch('/api/capture-screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || `Server responded with status ${response.status}`);
            }
            
            const imageDataURL = `data:image/png;base64,${result.image}`;
            imagePreviewContainer.innerHTML = `<img src="${imageDataURL}" class="max-w-full h-auto rounded-lg shadow-md" alt="Generated Code Output Image">`;

        } else {
            // --- STANDARD CONSOLE CAPTURE (for all console languages) ---
            const canvas = await html2canvas(outputContainer, {
                backgroundColor: window.getComputedStyle(outputContainer).backgroundColor,
                scale: 2 
            });

            const imageDataURL = canvas.toDataURL('image/png');
            imagePreviewContainer.innerHTML = `<img src="${imageDataURL}" class="max-w-full h-auto rounded-lg shadow-md" alt="Generated Code Output Image">`;
        }
    } catch (error) {
        console.error('Capture Failed:', error);
        imagePreviewContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

function extractTagContent(tag, fullCode) {
    const regex = new RegExp('<' + tag + '\b[^>]*>([\s\S]*?)<\/' + tag + '>', 'ig');
    let content = '';
    let match;
    while ((match = regex.exec(fullCode)) !== null) {
        content += match[1].trim() + '\n';
    }
    return content.trim();
}

function extractWebFiles(fullCode) {
    const files = [];
    
    const cssContent = extractTagContent('style', fullCode);
    const jsContent = extractTagContent('script', fullCode);

    let htmlContent = fullCode
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/ig, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/ig, '')
        .trim();

    if (htmlContent) { files.push({ name: "index.html", content: htmlContent }); }
    if (cssContent) { files.push({ name: "styles.css", content: cssContent }); }
    if (jsContent) { files.push({ name: "script.js", content: jsContent }); }
    
    if (files.length === 0 && fullCode.trim().length > 0) {
         files.push({ name: "index.html", content: fullCode });
    }
    
    return files;
}

function guessLanguageFromCode(code) {
    const normalizedCode = code.trim().toLowerCase();
    if (normalizedCode.includes('<!doctype html') || normalizedCode.includes('<html') || normalizedCode.includes('</body')) return 'html'; 
    if (normalizedCode.includes('def ') || normalizedCode.includes('print(') || normalizedCode.includes('elif ') || normalizedCode.includes('import ')) return 'python';
    if (normalizedCode.includes('console.log') || normalizedCode.includes('const ') || normalizedCode.includes('let ') || normalizedCode.includes('function ')) return 'javascript';
    if (normalizedCode.includes('public static void main') && normalizedCode.includes('system.out.println')) return 'java';
    if (normalizedCode.includes('#include <iostream>') || normalizedCode.includes('std::cout')) return 'cpp';
    if (normalizedCode.includes('#include <stdio.h>') && normalizedCode.includes('printf')) return 'c';
    if (normalizedCode.includes('using system;') || normalizedCode.includes('console.writeline')) return 'csharp';
    return 'python'; // Default to python
}

function getDownloadContent() {
    let allPracticalsHtml = '';
    conversationHistory.forEach((practical, index) => {
        const practicalContainer = document.getElementById(`practical-${index}`);
        const solutionContainer = practicalContainer.querySelector('.solution-text-container');
        
        const clone = solutionContainer.cloneNode(true);

        // Remove all interactive buttons and input areas from the clone
        clone.querySelectorAll('.run-code-button, .capture-output-button, .copy-button, .read-aloud-button, .code-input-container, .delete-input-button').forEach(el => el.remove());

        // The user wants "OUTPUT" heading, let's add it
        const outputContainers = clone.querySelectorAll('.code-output-container');
        outputContainers.forEach(outputContainer => {
            const outputHeading = document.createElement('p');
            outputHeading.innerHTML = '<br><b style="font-size: 16px;">OUTPUT</b>';
            outputContainer.before(outputHeading);
        });

        // Find the generated image in the *original* container to get the correct src
        const imagePreview = practicalContainer.querySelector(`#image-preview-container-${index} img`);
        
        // Remove the preview container from the clone so we can manually add the image later
        clone.querySelectorAll('.image-preview-container').forEach(el => el.remove());

        let imageHtml = '';
        if (imagePreview && imagePreview.src) {
            // Add a heading for the generated image
            imageHtml = `<br><img src="${imagePreview.src}" style="max-width: 100%; border: 1px solid #ccc; margin-top: 10px;">`;
        }

        allPracticalsHtml += `
            <div class="${index > 0 ? 'html2pdf__page-break' : ''}">
                <p style="font-size: 16pt;">
                    <b>Practical No: ${practical.practicalNo}</b> - <span style="font-weight: normal; font-size: 12pt;">${practical.question}</span>
                </p>
                ${clone.innerHTML}
                ${imageHtml}
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
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .code-output-container {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    padding: 10px;
                    margin-top: 10px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .image-preview-container img {
                    max-width: 100%;
                    border: 1px solid #ccc;
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
    saveAs(blob, 'Full_Assignment_Solution.doc');
}

function downloadAsPdf() {
    const content = getDownloadContent();
    const options = {
        margin: 1,
        filename: 'Full_Assignment_Solution.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all', before: '.html2pdf__page-break' } 
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

function startTour() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-has-cancel-icon shepherd-has-title',
            scrollTo: true
        }
    });

    tour.addStep({
        title: 'Welcome to Ace Q&A!',
        text: 'This is a quick tour to get you started.',
        attachTo: {
            element: '.container',
            on: 'top'
        },
        buttons: [
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ]
    });

    tour.addStep({
        title: 'Enter Your Questions',
        text: 'You can type or paste your questions here. You can ask multiple questions at once by separating them with a new line.',
        attachTo: {
            element: '#question-input',
            on: 'bottom'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ]
    });

    tour.addStep({
        title: 'Get Your Solution',
        text: 'Click this button to get the solution to your questions.',
        attachTo: {
            element: '#solve-button',
            on: 'bottom'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ]
    });

    tour.addStep({
        title: 'View Your Solution',
        text: 'Your solutions will appear here. You can edit or delete them as needed.',
        attachTo: {
            element: '#solution-output',
            on: 'top'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ]
    });

    tour.addStep({
        title: 'Manage Your Session',
        text: 'You can download your solutions, clear the session, or export/import your session history.',
        attachTo: {
            element: '.actions',
            on: 'bottom'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ]
    });

    tour.addStep({
        title: 'Toggle Theme',
        text: 'Switch between light and dark mode for your comfort.',
        attachTo: {
            element: '#theme-toggle',
            on: 'bottom'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Finish'
            }
        ]
    });

    tour.on('complete', () => {
        localStorage.setItem('hasVisited', 'true');
    });

    tour.start();
}

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

// Capture within iframe and send image back into the app (no download)
async function captureIframeAndSend(){
    try{
        const overlay=document.getElementById('ai-preview-overlay');
        const iframe=overlay.querySelector('#ai-preview-iframe');
        const w=iframe.contentWindow; const d=w.document;
        const ensure = () => new Promise((res)=>{ if(w.html2canvas){res();return;} const s=d.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload=()=>res(); d.head.appendChild(s); });
        await ensure();
        const btn=d.getElementById('ai-generate-image'); const old=btn?btn.style.display:null; if(btn) btn.style.display='none';
        const canvas=await w.html2canvas(d.body,{useCORS:true,allowTaint:true,scale:2,logging:false,backgroundColor:null});
        if(btn) btn.style.display=old||'';
        const url=canvas.toDataURL('image/png');
        insertImageIntoLatestSolution(url);
        Swal.fire({toast:true,position:'top-end',timer:1500,showConfirmButton:false,icon:'success',title:'Image added to latest solution'});
    }catch(e){
        console.error('Send to app failed',e);
        Swal.fire({icon:'error',title:'Failed',text:e.message||'Could not send image to app.'});
    }
}

// Listen for image from preview tab (postMessage)
window.addEventListener('message', (evt) => {
    try{
        const data = evt.data || {};
        if (data.type === 'ABSOL_PREVIEW_IMAGE' && data.dataUrl) {
            insertImageIntoLatestSolution(data.dataUrl);
            Swal.fire({toast:true,position:'top-end',timer:1500,showConfirmButton:false,icon:'success',title:'Image received and added'});
        }
    }catch(_){}
});

// Append the image under the latest solution so exports include it
function insertImageIntoLatestSolution(dataUrl){
    try{
        if (conversationHistory.length === 0) return;
        const latestIndex = conversationHistory.length - 1;
        const container = document.getElementById(`practical-${latestIndex}`);
        if (!container) return;
        let shotWrap = container.querySelector('.generated-preview-wrap');
        if (!shotWrap) {
            shotWrap = document.createElement('div');
            shotWrap.className = 'generated-preview-wrap';
            shotWrap.style.margin = '12px 0';
            const title = document.createElement('div');
            title.textContent = 'Generated Output Image';
            title.style.fontWeight = '600';
            title.style.marginBottom = '6px';
            shotWrap.appendChild(title);
            container.appendChild(shotWrap);
        }
        const img = document.createElement('img');
        img.src = dataUrl; img.alt = 'Preview';
        img.style.maxWidth = '100%'; img.style.borderRadius = '8px'; img.style.border = '1px solid #2a2f3a';
        shotWrap.innerHTML = shotWrap.firstChild ? shotWrap.firstChild.outerHTML : '';
        shotWrap.appendChild(img);
        // Persist image reference in history for future use
        conversationHistory[latestIndex].previewImage = dataUrl;
        saveSession();
    }catch(e){ console.error('Insert image failed', e); }
}
            // Populate speechVoices immediately if available
            if (speechSynthesis.getVoices().length > 0) {
                speechVoices = speechSynthesis.getVoices();
                console.log('Speech voices populated on load.', speechVoices);
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
let speechVoices = [];

speechSynthesis.onvoiceschanged = () => {
    speechVoices = speechSynthesis.getVoices();
    console.log('Available Speech Synthesis Voices:', speechVoices);
};

function readAloud(index, buttonElement) {
    const wasActive = (activeReadAloudButton === buttonElement);

    speechSynthesis.cancel();
    if (activeReadAloudButton) {
        activeReadAloudButton.innerText = 'Read Aloud';
    }
    activeReadAloudButton = null;

    if (!wasActive) {
        const speakText = () => {
            const text = conversationHistory[index].solution;
            const utterance = new SpeechSynthesisUtterance(text);

            const selectedVoice = speechVoices.find(voice => voice.name === 'Google UK English Male') || speechVoices.find(voice => voice.name === 'Google UK English Female') || speechVoices[0];
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('Selected Voice:', selectedVoice.name);
            } else {
                console.warn('No suitable voice found, using default.');
            }

            utterance.onend = () => {
                if (activeReadAloudButton === buttonElement) {
                    buttonElement.innerText = 'Read Aloud';
                    activeReadAloudButton = null;
                }
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
                Swal.fire({
                    icon: 'error',
                    title: 'Speech Error',
                    text: 'Could not play speech. Please try again or check your browser settings.',
                    customClass: {
                        popup: currentTheme === 'dark' ? 'swal2-dark' : 'swal2-light'
                    },
                    background: currentTheme === 'dark' ? '#1e1e1e' : '#ffffff',
                    color: currentTheme === 'dark' ? '#e0e0e0' : '#333333'
                });
                if (activeReadAloudButton === buttonElement) {
                    buttonElement.innerText = 'Read Aloud';
                    activeReadAloudButton = null;
                }
            };

            speechSynthesis.speak(utterance);
            buttonElement.innerText = 'Stop';
            activeReadAloudButton = buttonElement;
        };

        if (speechVoices.length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                speechVoices = speechSynthesis.getVoices();
                if (speechVoices.length > 0) {
                    speakText();
                }
            }, { once: true });
        } else {
            speakText();
        }
    }
}

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

// Build a single runnable HTML document from markdown that may contain multiple code blocks
function buildIntegratedHTMLFromSolution(markdown) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let match;
    let htmlBlocks = [];
    let cssBlocks = [];
    let jsBlocks = [];

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
        const lang = (match[1] || '').toLowerCase().trim();
        const content = match[2] || '';
        if (lang.includes('html')) htmlBlocks.push(content);
        else if (lang.includes('css')) cssBlocks.push(content);
        else if (lang.includes('js') || lang.includes('javascript') || lang.includes('ts')) jsBlocks.push(content);
    }

    const css = cssBlocks.join('\n\n');
    const js = jsBlocks.join('\n\n');
    let base = htmlBlocks[0] || '';

    if (!base) {
        // No explicit HTML provided; create a wrapper
        base = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Preview</title>\n</head>\n<body>\n<div id="app"></div>\n</body>\n</html>`;
    }

    // Inject CSS into <head>
    if (css.trim().length > 0) {
        if (base.match(/<head[^>]*>/i)) {
            base = base.replace(/<head[^>]*>/i, (m) => `${m}\n<style id="ai-injected-styles">\n${css}\n</style>`);
        } else {
            base = base.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n<style id="ai-injected-styles">\n${css}\n</style>\n</head>`);
        }
    }

    // Inject JS before </body>
    if (js.trim().length > 0) {
        if (base.match(/<\/body>/i)) {
            base = base.replace(/<\/body>/i, `<script id="ai-injected-script">\n${js}\n<\/script>\n</body>`);
        } else {
            base += `\n<script id="ai-injected-script">\n${js}\n<\/script>`;
        }
    }

    // Inject helper style and Generate Image button using html2canvas in the preview document
    const helperStyle = `\n<style id="ai-preview-toolbar-style">\n.ai-shot-btn{position:fixed;right:16px;bottom:16px;z-index:99999;background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:10px 14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Noto Sans','Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji';box-shadow:0 6px 16px rgba(14,165,233,.5);cursor:pointer} .ai-shot-btn:active{transform:translateY(1px)}\n</style>`;
    if (base.match(/<head[^>]*>/i)) {
        base = base.replace(/<head[^>]*>/i, (m) => `${m}\n${helperStyle}`);
    } else {
        base = base.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${helperStyle}\n</head>`);
    }

    const helperScript = `\n<script id="ai-preview-toolbar-script">\n(function(){\n  function injectBtn(){\n    if(document.getElementById('ai-generate-image')) return;\n    var b=document.createElement('button');\n    b.id='ai-generate-image';\n    b.className='ai-shot-btn';\n    b.textContent='Generate Image';\n    b.onclick=async function(){\n      try{\n        if(typeof html2canvas==='undefined'){\n          var s=document.createElement('script');\n          s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';\n          s.onload=doShot;\n          document.head.appendChild(s);\n        } else { doShot(); }\n      }catch(e){ console.error('Shot error',e); alert('Failed to capture image'); }\n    };\n    document.body.appendChild(b);\n  }\n  async function doShot(){\n    try{\n      var btn=document.getElementById('ai-generate-image'); var old=btn?btn.style.display:null; if(btn) btn.style.display='none';\n      const canvas=await html2canvas(document.body,{useCORS:true,allowTaint:true,scale:2,logging:false,backgroundColor:null});\n      if(btn) btn.style.display=old||'';\n      const url=canvas.toDataURL('image/png');\n      const a=document.createElement('a');\n      a.href=url; a.download='preview.png';\n      document.body.appendChild(a); a.click(); a.remove();\n      try{ if(window.opener && typeof window.opener.postMessage==='function'){ window.opener.postMessage({ type:'ABSOL_PREVIEW_IMAGE', dataUrl:url }, '*'); } }catch(_){}\n    }catch(e){ console.error('Capture failed',e); alert('Capture failed'); }\n  }\n  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',injectBtn);} else { injectBtn(); }\n})();\n<\/script>`;
    if (base.match(/<\/body>/i)) {
        base = base.replace(/<\/body>/i, `${helperScript}\n</body>`);
    } else {
        base += `\n${helperScript}`;
    }

    return base;
}

// Open the integrated HTML in a new tab for instant preview
function runIntegrated(index) {
    try {
        const md = conversationHistory[index]?.solution || '';
        const html = buildIntegratedHTMLFromSolution(md);
        const win = window.open('', '_blank');
        if (!win) {
            // Fallback to inline iframe preview
            openIntegratedInline(html);
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
    } catch (e) {
        console.error('Run Integrated Error:', e);
        // Fallback to inline iframe if any error occurs
        try {
            const md = conversationHistory[index]?.solution || '';
            const html = buildIntegratedHTMLFromSolution(md);
            openIntegratedInline(html);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Preview Error', text: e.message || 'Failed to open preview.' });
        }
    }
}

// Create or reuse a fullscreen modal with an iframe to display integrated preview
function ensurePreviewModal() {
    let overlay = document.getElementById('ai-preview-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ai-preview-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.7)', zIndex: '10000', display: 'none'
        });
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: '96vw', height: '92vh', background: '#101218', borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden', border: '1px solid #2a2f3a'
        });
        const bar = document.createElement('div');
        Object.assign(bar.style, {
            height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 12px', background: '#151923', color: '#e6e6e6', borderBottom: '1px solid #2a2f3a'
        });
        const titleSpan = document.createElement('span');
        titleSpan.textContent = 'Preview';
        bar.appendChild(titleSpan);
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Image';
        saveBtn.className = 'edit-button';
        saveBtn.style.cursor = 'pointer';
        saveBtn.onclick = () => captureIframeImage();
        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send to App';
        sendBtn.className = 'edit-button';
        sendBtn.style.cursor = 'pointer';
        sendBtn.onclick = () => captureIframeAndSend();
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'edit-button';
        Object.assign(closeBtn.style, { cursor: 'pointer' });
        closeBtn.onclick = () => overlay.style.display = 'none';
        actions.appendChild(saveBtn);
        actions.appendChild(sendBtn);
        actions.appendChild(closeBtn);
        bar.appendChild(actions);
        const iframe = document.createElement('iframe');
        iframe.id = 'ai-preview-iframe';
        Object.assign(iframe.style, { width: '100%', height: 'calc(100% - 44px)', border: '0', background: '#ffffff' });
        panel.appendChild(bar);
        panel.appendChild(iframe);
        overlay.appendChild(panel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        });
        document.body.appendChild(overlay);
    }
    return overlay;
}

function openIntegratedInline(html) {
    const overlay = ensurePreviewModal();
    const iframe = overlay.querySelector('#ai-preview-iframe');
    overlay.style.display = 'block';
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
}

async function captureIframeImage(){
    try{
        const overlay=document.getElementById('ai-preview-overlay');
        const iframe=overlay.querySelector('#ai-preview-iframe');
        const w=iframe.contentWindow;
        const d=w.document;
        // Ensure html2canvas exists inside iframe; if not, inject then capture
        const ensure = () => new Promise((res)=>{
            if(w.html2canvas){res();return;}
            const s=d.createElement('script');
            s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload=()=>res();
            d.head.appendChild(s);
        });
        await ensure();
        const btn=d.getElementById('ai-generate-image'); const old=btn?btn.style.display:null; if(btn) btn.style.display='none';
        const canvas=await w.html2canvas(d.body,{useCORS:true,allowTaint:true,scale:2,logging:false,backgroundColor:null});
        if(btn) btn.style.display=old||'';
        const url=canvas.toDataURL('image/png');
        const a=document.createElement('a');
        a.href=url; a.download='preview.png';
        document.body.appendChild(a); a.click(); a.remove();
    }catch(e){
        console.error('Iframe capture failed',e);
        Swal.fire({icon:'error',title:'Capture Failed',text:e.message||'Could not capture preview image.'});
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
        const readAloudButtonHtml = `<button class="read-aloud-button">Read Aloud</button>`;
        const editSolutionButton = `<button class="edit-button" onclick="openEditSolutionModal(${index})">Edit Solution</button>`;
        const runButton = `<button class="edit-button" onclick="runIntegrated(${index})">Run</button>`;
        practicalContainer.innerHTML = `<h2>Practical No: ${practical.practicalNo}${editButton}${deleteButton}${readAloudButtonHtml}${editSolutionButton}${runButton}</h2><p>${practical.question}</p><div class="solution-text-container markdown-body">${htmlSolution}</div>`;
        outputElement.appendChild(practicalContainer);

        // Attach event listener for the read aloud button
        const currentReadAloudButton = practicalContainer.querySelector('.read-aloud-button');
        if (currentReadAloudButton) {
            currentReadAloudButton.addEventListener('click', () => readAloud(index, currentReadAloudButton));
        }
    });
    hljs.highlightAll();
    addCopyButtons();
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

// Streaming helper using Server-Sent Events
function streamSolution(questionText, onUpdate, onComplete, onError) {
    return new Promise((resolve, reject) => {
        let finished = false;
        let buffer = '';
        let throttleId = null;
        const flush = () => {
            throttleId = null;
            try { onUpdate && onUpdate(buffer); } catch (_) {}
        };

        const useFetchFallback = async () => {
            try {
                const resp = await fetch(`/api/solve/stream?q=${encodeURIComponent(questionText)}`, {
                    headers: { 'Accept': 'text/event-stream' }
                });
                if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
                const reader = resp.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let leftover = '';
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    leftover += decoder.decode(value, { stream: true });
                    let idx;
                    while ((idx = leftover.indexOf('\n\n')) !== -1) {
                        const chunk = leftover.slice(0, idx);
                        leftover = leftover.slice(idx + 2);
                        const lines = chunk.split('\n');
                        let eventName = 'message';
                        let dataLine = '';
                        for (const line of lines) {
                            if (line.startsWith('event:')) eventName = line.slice(6).trim();
                            if (line.startsWith('data:')) dataLine += line.slice(5).trim();
                        }
                        if (eventName === 'end') {
                            if (throttleId) { clearTimeout(throttleId); flush(); }
                            finished = true;
                            try { onComplete && onComplete(buffer); } catch (_) {}
                            resolve();
                            return;
                        }
                        if (dataLine) {
                            try {
                                const payload = JSON.parse(dataLine);
                                if (payload.text) {
                                    buffer += payload.text;
                                    if (!throttleId) throttleId = setTimeout(flush, 80);
                                }
                            } catch (_) {}
                        }
                    }
                }
                if (!finished) {
                    if (throttleId) { clearTimeout(throttleId); flush(); }
                    try { onComplete && onComplete(buffer); } catch (_) {}
                    resolve();
                }
            } catch (e) {
                try { onError && onError(e); } catch (_) {}
                reject(e);
            }
        };

        if (window.EventSource) {
            try {
                const es = new EventSource(`/api/solve/stream?q=${encodeURIComponent(questionText)}`);
                es.onmessage = (evt) => {
                    try {
                        const payload = JSON.parse(evt.data || '{}');
                        if (payload.text) {
                            buffer += payload.text;
                            if (!throttleId) throttleId = setTimeout(flush, 80);
                        }
                    } catch (_) {}
                };
                es.addEventListener('end', () => {
                    if (throttleId) { clearTimeout(throttleId); flush(); }
                    es.close();
                    finished = true;
                    try { onComplete && onComplete(buffer); } catch (_) {}
                    resolve();
                });
                es.addEventListener('error', async () => {
                    es.close();
                    if (finished) return;
                    // fallback to fetch-stream
                    await useFetchFallback();
                });
            } catch (_) {
                // If EventSource construction throws, fallback
                useFetchFallback();
            }
        } else {
            // No EventSource support
            useFetchFallback();
        }
    });
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
    
    practicalContainer.innerHTML = `<h2>Practical No: ${conversationHistory[index].practicalNo}<button class="edit-button" onclick="openEditModal(${index})">Edit</button><button class="delete-button" onclick="deletePractical(${index})">Delete</button><button class="edit-button" onclick="openEditSolutionModal(${index})">Edit Solution</button><button class="edit-button" onclick="runIntegrated(${index})">Run</button></h2><p>${newQuestion}</p>`;
    practicalContainer.appendChild(solutionContainer);
    solutionContainer.innerHTML = '<div class="loader"></div>';

    try {
        await streamSolution(newQuestion, (buffer) => {
            solutionContainer.innerHTML = marked.parse(buffer);
        }, (finalText) => {
            conversationHistory[index].solution = finalText;
            saveSession();
            hljs.highlightAll();
            addCopyButtons();
            addRunCodeButtons();
            renderMermaidDiagrams();
        }, (err) => {
            solutionContainer.innerHTML = `<p style="color: red;">Error: ${err?.message || 'Streaming failed'}</p>`;
        });
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
    solveButton.innerHTML = '<div class="loading-content-wrapper"><span>Generating</span><span class="ellipsis-container"><span>.</span><span>.</span><span>.</span></span></div>';

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
        practicalContainer.innerHTML = `<h2>Practical No: ${currentPracticalNo}<button class="edit-button" onclick="openEditModal(${practicalCount})">Edit</button><button class="delete-button" onclick="deletePractical(${currentPracticalNo - 1})">Delete</button><button class="edit-button" onclick="openEditSolutionModal(${practicalCount})">Edit Solution</button><button class=\"edit-button\" onclick=\"runIntegrated(${practicalCount})\">Run</button></h2><p>${questionText}</p>`;
        practicalContainer.appendChild(solutionContainer);
        outputElement.appendChild(practicalContainer);
        solutionContainer.innerHTML = '<div class="loader"></div>';

        try {
            await streamSolution(questionText, (buffer) => {
                solutionContainer.innerHTML = marked.parse(buffer);
            }, (finalText) => {
                solutionContainer.innerHTML = marked.parse(finalText);
                const newPractical = {
                    question: questionText,
                    solution: finalText,
                    practicalNo: currentPracticalNo
                };
                conversationHistory.push(newPractical);
                saveSession();

                hljs.highlightAll();
                addCopyButtons();
                addRunCodeButtons();
                renderMermaidDiagrams();

                practicalCount++;
                wordButton.style.display = 'block';
                document.getElementById('clear-button').style.display = 'block';
                document.getElementById('export-button').style.display = 'block';

                latestSolutionId = `practical-${practicalCount - 1}`;
                scrollToSolutionButton.style.display = 'flex';
            }, (err) => {
                solutionContainer.innerHTML = `<p style="color: red;">Error: ${err?.message || 'Streaming failed'}</p>`;
                console.error('Stream Error:', err);
            });
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
            console.log("OneCompiler API Result for HTML:", result); // Log the full result object
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

    let htmlContent = fullCode;

    // Replace style tags with a link to styles.css
    if (cssContent) {
        htmlContent = htmlContent.replace(/<style\b[^>]*>[\s\S]*?<\/style>/ig, '<link rel="stylesheet" href="styles.css">');
        files.push({ name: "styles.css", content: cssContent });
    }

    // Replace script tags with a link to script.js
    if (jsContent) {
        htmlContent = htmlContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/ig, '<script src="script.js"></script>');
        files.push({ name: "script.js", content: jsContent });
    }

    // Ensure there's a head tag for the CSS link if it was added
    if (cssContent && !htmlContent.includes('<head>')) {
        htmlContent = `<head>\n</head>\n${htmlContent}`;
    }
    
    // If a CSS link was added and there's a head tag, ensure it's inside the head
    if (cssContent && htmlContent.includes('<link rel="stylesheet" href="styles.css">') && htmlContent.includes('</head>')) {
         htmlContent = htmlContent.replace('</head>', '<link rel="stylesheet" href="styles.css">\n</head>');
    }


    if (htmlContent) {
        files.push({ name: "index.html", content: htmlContent });
    }
    
    // Fallback for code that is pure HTML (no style or script tags)
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

        // Remove all interactive buttons and input areas
        clone.querySelectorAll('.run-code-button, .capture-output-button, .copy-button, .read-aloud-button, .code-input-container, .delete-input-button').forEach(el => el.remove());

        // Find the generated image in the original container
        const imagePreview = practicalContainer.querySelector(`#image-preview-container-${index} img`);
        
        let imageHtml = '';
        if (imagePreview && imagePreview.src) {
            // If an image exists, use it and remove the text-based output container from the clone
            imageHtml = `<br><img src="${imagePreview.src}" style="max-width: 100%; border: 1px solid #ccc; margin-top: 10px;">`;
            clone.querySelectorAll('.code-output-container').forEach(el => el.remove());
        } else {
            // If no image, add the "OUTPUT" heading to the existing text-based output
            const outputContainers = clone.querySelectorAll('.code-output-container');
            outputContainers.forEach(outputContainer => {
                const outputHeading = document.createElement('p');
                outputHeading.innerHTML = '<br><b style="font-size: 16px;">OUTPUT</b>';
                outputContainer.before(outputHeading);
            });
        }

        // Always remove the preview container from the clone (it's either empty or we're replacing it)
        clone.querySelectorAll('.image-preview-container').forEach(el => el.remove());

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

// --- REVIEWS --- //
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reviews = await response.json();
        const reviewsList = document.getElementById('reviews-list');
        reviewsList.innerHTML = ''; // Clear existing reviews
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            const reviewDate = new Date(review.created_at).toLocaleString();
            // Use review.review to match the database column
            reviewElement.innerHTML = `<p class="review-content">${review.review}</p><small><strong class="review-name">${review.name}</strong> - ${reviewDate}</small>`;
            reviewsList.appendChild(reviewElement);
        });
    } catch (error) {
        console.error("Could not load reviews:", error);
        document.getElementById('reviews-list').innerHTML = '<p style="color: red;">Could not load reviews.</p>';
    }
}

document.getElementById('review-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('review-name-input');
    const reviewInput = document.getElementById('review-input');
    const name = nameInput.value;
    const content = reviewInput.value;
    const submitButton = document.getElementById('submit-review-button');
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';

    const swalTheme = {
        background: currentTheme === 'dark' ? '#1e1e1e' : '#ffffff',
        color: currentTheme === 'dark' ? '#e0e0e0' : '#333333'
    };

    if (!name.trim() || !content.trim()) {
        Swal.fire({
            title: 'Oops...',
            text: 'Name and review cannot be empty!',
            icon: 'error',
            ...swalTheme
        });
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<div class="loader-small"></div> Submitting...';

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newReview = await response.json();

        const reviewsList = document.getElementById('reviews-list');
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review';
        const reviewDate = new Date(newReview.created_at).toLocaleString();
        reviewElement.innerHTML = `<p class="review-content">${newReview.review}</p><small><strong class="review-name">${newReview.name}</strong> - ${reviewDate}</small>`;
        reviewsList.prepend(reviewElement);

        nameInput.value = '';
        reviewInput.value = '';
        Swal.fire({
            title: 'Success!',
            text: 'Thank you for your review!',
            icon: 'success',
            ...swalTheme
        });

    } catch (error) {
        console.error("Failed to submit review:", error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to submit review. Please try again later.',
            icon: 'error',
            ...swalTheme
        });
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Review';
    }
});

// Load reviews when the page is ready
document.addEventListener('DOMContentLoaded', loadReviews);

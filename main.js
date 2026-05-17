import { AnkiProcessor } from './anki-processor.js';

document.addEventListener('DOMContentLoaded', () => {
    const processor = new AnkiProcessor();
    let cards = [];
    let currentIndex = 0;
    let currentFilename = '';

    const MAX_SAVED_FILES = 5;

    function getResumeState() {
        try {
            return JSON.parse(localStorage.getItem('anki_resume_state')) || {};
        } catch (e) {
            return {};
        }
    }

    function saveResumeState(state) {
        localStorage.setItem('anki_resume_state', JSON.stringify(state));
    }

    function updateProgressInStorage() {
        if (!currentFilename) return;
        const state = getResumeState();
        if (state[currentFilename]) {
            state[currentFilename].index = currentIndex;
            state[currentFilename].lastAccessed = Date.now();
            saveResumeState(state);
        }
    }

    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadView = document.getElementById('upload-view');
    const studyView = document.getElementById('study-view');
    const loader = document.getElementById('global-loader');
    
    const flashcard = document.getElementById('flashcard');
    const frontContent = document.getElementById('card-front-content');
    const backContent = document.getElementById('card-back-content');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const deckNameLabel = document.getElementById('deck-name');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Canvas elements
    const canvas = document.getElementById('scribble-canvas');
    const clearScribbleBtn = document.getElementById('clear-scribble-btn');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function initCanvas() {
        if (!canvas) return;

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#a855f7'; // accent-secondary color
        }

        window.addEventListener('resize', resizeCanvas);

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            
            let clientX = e.clientX;
            let clientY = e.clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            [lastX, lastY] = [x, y];
        }

        function startDrawing(e) {
            isDrawing = true;
            let clientX = e.clientX;
            let clientY = e.clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            const rect = canvas.getBoundingClientRect();
            [lastX, lastY] = [clientX - rect.left, clientY - rect.top];
        }

        function stopDrawing() {
            isDrawing = false;
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);
        
        clearScribbleBtn.addEventListener('click', clearCanvas);
    }
    
    function clearCanvas() {
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    initCanvas();

    // Event Listeners
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.apkg')) {
            handleFileUpload(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    async function handleFileUpload(file) {
        try {
            loader.style.display = 'block';
            dropZone.style.display = 'none';
            
            cards = await processor.processFile(file);
            
            if (cards.length === 0) {
                alert('No cards found in this deck.');
                resetUI();
                return;
            }

            currentFilename = file.name;
            const state = getResumeState();
            
            if (state[currentFilename]) {
                // Ensure index is within bounds
                currentIndex = Math.min(state[currentFilename].index, cards.length - 1);
                state[currentFilename].lastAccessed = Date.now();
            } else {
                currentIndex = 0;
                state[currentFilename] = { index: 0, lastAccessed: Date.now() };
            }
            
            // Keep only up to MAX_SAVED_FILES based on lastAccessed
            const keys = Object.keys(state);
            if (keys.length > MAX_SAVED_FILES) {
                const sortedKeys = keys.sort((a, b) => state[b].lastAccessed - state[a].lastAccessed);
                const keysToRemove = sortedKeys.slice(MAX_SAVED_FILES);
                keysToRemove.forEach(key => delete state[key]);
            }
            
            saveResumeState(state);

            deckNameLabel.textContent = file.name.replace('.apkg', '');
            renderCard();
            
            uploadView.style.display = 'none';
            studyView.style.display = 'flex';
            studyView.classList.add('fade-in');
            
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        } catch (error) {
            console.error(error);
            alert('Error processing file: ' + error.message);
            resetUI();
        } finally {
            loader.style.display = 'none';
        }
    }

    async function renderCard() {
        if (cards.length === 0) return;
        
        const card = cards[currentIndex];
        
        // Reset flip state
        flashcard.classList.remove('flipped');
        
        // Process HTML (media urls, etc)
        frontContent.innerHTML = await processor.processHtml(card.front);
        backContent.innerHTML = await processor.processHtml(card.back);
        
        // Update progress
        const progress = ((currentIndex + 1) / cards.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentIndex + 1} / ${cards.length}`;
        
        // Update buttons
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === cards.length - 1;
    }

    function flipCard() {
        flashcard.classList.toggle('flipped');
    }

    function nextCard() {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            renderCard();
            updateProgressInStorage();
            clearCanvas();
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            renderCard();
            updateProgressInStorage();
            clearCanvas();
        }
    }

    function resetUI() {
        studyView.style.display = 'none';
        uploadView.style.display = 'flex';
        dropZone.style.display = 'flex';
        fileInput.value = '';
        cards = [];
        currentFilename = '';
    }

    // Control listeners
    flipBtn.addEventListener('click', flipCard);
    flashcard.addEventListener('click', flipCard);
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);
    resetBtn.addEventListener('click', resetUI);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (studyView.style.display === 'flex') {
            if (e.code === 'Space') {
                e.preventDefault();
                flipCard();
            } else if (e.code === 'ArrowRight') {
                nextCard();
            } else if (e.code === 'ArrowLeft') {
                prevCard();
            }
        }
    });
});

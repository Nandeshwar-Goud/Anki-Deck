import { AnkiProcessor } from './anki-processor.js';

document.addEventListener('DOMContentLoaded', () => {
    const processor = new AnkiProcessor();
    let cards = [];
    let currentIndex = 0;

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

            deckNameLabel.textContent = file.name.replace('.apkg', '');
            currentIndex = 0;
            renderCard();
            
            uploadView.style.display = 'none';
            studyView.style.display = 'flex';
            studyView.classList.add('fade-in');
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
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            renderCard();
        }
    }

    function resetUI() {
        studyView.style.display = 'none';
        uploadView.style.display = 'flex';
        dropZone.style.display = 'flex';
        fileInput.value = '';
        cards = [];
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

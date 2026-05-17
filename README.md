# Anki Deck Processor

A web application that allows users to upload `.apkg` (Anki) files, parse their contents, and study flashcards using a modern, interactive interface. The application tracks your progress and can resume study sessions from where you left off.

## Features

- **Upload `.apkg` Files**: Load your Anki decks directly into the browser.
- **Flashcard Study Mode**: Review flashcards with a sleek, animated user interface.
- **Progress Tracking**: Automatically saves your progress so you can resume exactly where you exited.
- **Local Processing**: Deck processing is done completely in the browser using `sql.js` and `jszip` for maximum privacy and performance.

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Build Tool**: Vite
- **Dependencies**: 
  - `jszip` (for unzipping `.apkg` files)
  - `sql.js` (for reading Anki SQLite databases)

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project folder.
2. Install the required dependencies:

```bash
npm install
```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

This will launch Vite. Open the provided local URL (usually `http://localhost:5173/`) in your browser to view the application.

### Building for Production

To create a production-ready build, run:

```bash
npm run build
```

The optimized files will be generated in the `dist` directory.

## Usage

1. Open the application in your browser.
2. Click the upload button to select an `.apkg` file from your computer.
3. Wait for the deck to process.
4. Begin studying your flashcards. Your progress is automatically saved!

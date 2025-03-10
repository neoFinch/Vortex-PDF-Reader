# Learning Accelerator  

**Learning Accelerator** is a desktop application that allows you to import documents (currently supporting PDFs) and perform Q&A on each document.  

## Features  
- Import PDF documents  
- Perform Q&A on individual PDFs using AI-powered processing  
- Cross-platform support (depending on build configuration)  

## Getting Started  

### Prerequisites  
Ensure you have the following installed:  
- **Node.js** (version 22 or later)  
- **npm** (Node Package Manager)  
- **Ollama** (for AI-powered processing) – [Download Ollama](https://ollama.com/download)  

### Installation Steps  
1. **Clone the repository**:  
   ```sh
   git clone <repo-url>
   cd <project-folder>
2. **Install dependency**
   ```sh
   npm install
3. **Set up Ollama**:
  Install Ollama if not already installed: Download Here
  Pull the required embedding model:
    ```sh
    ollama pull nomic-embed-text
4. **Run App in development mode**
   ```sh
   npm start
5. **Build the production-ready app**:
   ```sh
   npm run make
6. **Locate the generated build**:
   - The output files will be available in the `out/` folder.


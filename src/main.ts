import { app, BaseWindow, BrowserWindow, dialog, ipcMain, WebContentsView } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs, { copyFileSync } from 'node:fs';
import { indexPdf, initLLM, loadVectorStoreAndGraph } from './backend/rag';
import { DB, dbSchema } from './backend/db';
import { CompiledStateGraph, Graph, StateDefinition, StateGraph } from '@langchain/langgraph';
import { exec } from 'node:child_process';
import log from 'electron-log/main';
import { Worker } from 'node:worker_threads';


let initialWidth = 800;
let initialHeight = 600;

console.log('app path ; ', path.join(app.getPath('userData'), 'pdfs'));


// Initialize logging
let ollamaPath = ''
log.initialize();
log.transports.file.resolvePathFn = () => path.join(path.join(app.getPath('userData')), 'logs/main.log');
console.log = log.log;

let graph: CompiledStateGraph<any, any> | null = null;
const db = new DB();
db.init();
// use this variable for book keeping to know which rag instance is currently active
let currentRagInstance = '';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// exec('which ollama', (error, stdout, stderr) => {
//   if (error) {
//     console.log(`exec log: ${error}`);
//     return;
//   }
//   if (stderr) {
//     console.log(`stderr: ${stderr}`);
//     return;
//   }
//   console.log(`ollama found at: ${stdout}`);
// });
let mainWindow: null | WebContentsView = null;
let pdfWindow: null | WebContentsView = null;
// Store references to all child windows
let childWindows: Array<WebContentsView> = [];



const createWindow = () => {
  let baseWindow: BaseWindow | null = null;
  baseWindow = new BaseWindow({
    title: 'PDF Viewer',
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
  });

  // Create the browser window.
  mainWindow = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  pdfWindow = new WebContentsView({
    webPreferences: {
      preload : path.join(__dirname, 'preload.js'),
    },
  })
  
  baseWindow.contentView.addChildView(mainWindow);
  baseWindow.contentView.addChildView(pdfWindow);
  // Add mainWindow to childWindows array
  childWindows.push(mainWindow);
  childWindows.push(pdfWindow);

  // Listen to resize event on baseWindow
  if (baseWindow) {
    baseWindow.on('resize', () => {
      const [width, height] = baseWindow.getSize();
      // Resize all child windows
      childWindows.forEach(child => {
        if (child.setBounds && child.getBounds) {
          // console.log('child window:', child.webContents.getURL());
          if (child.webContents.getURL().includes('pdf')) {
            // console.log('child window:', child.webContents.getURL());
            const { x, y } = child.getBounds();
            child.setBounds({ x: width / 2, y, width: width / 2, height });
          } else {
            const { x, y } = child.getBounds();
            child.setBounds({ x , y, width: width / 2, height });
          }
        }
      });
    }); 
  }

  // and load the index.html of the app. 
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.setBounds({ x: 0, y: 0, width: initialWidth / 2, height: 600 });
    const appDataPath = path.join(app.getPath('userData'), 'pdfs');
    console.log('will open pdf at:', appDataPath + '/BashNotesForProfessionals.pdf');
    pdfWindow.webContents.loadFile(appDataPath + '/BashNotesForProfessionals.pdf');
    pdfWindow.setBounds({ x: initialWidth / 2, y: 0, width: initialWidth / 2, height: 600 });
  } else {
    mainWindow.webContents.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  pdfWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


ipcMain.handle('select-and-save-pdf', async () => {
  try {
    // Open file picker dialog
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (result.canceled) {
      return { success: false, message: 'Selection canceled' };
    }

    // Get selected file path
    const sourcePath = result.filePaths[0];

    // Create app data directory if it doesn't exist
    const appDataPath = path.join(app.getPath('userData'), 'pdfs');
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }

    // Generate destination path with original filename
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(appDataPath, fileName);

    // Copy the file
    fs.copyFileSync(sourcePath, destinationPath);

    console.log(`File saved to: ${destinationPath}`);

    db.addBook({
      title: fileName,
      vectorDBCollectionMappping: '',
      indexingStatus: 'pending'
    });

    return {
      success: true,
      filePath: destinationPath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('index-pdf', async (event, fileName: string) => {
  console.log('Indexing PDFs...');
  try {
    // Get app data directory
    const appDataPath = path.join(app.getPath('userData'), 'pdfs');

    console.log('appDataPath:', appDataPath);

    // Get all files in the directory
    const files = fs.readdirSync(appDataPath);

    console.log('files:', files);

    // Iterate through each file and index it
    for await (const file of files) {
      console.log(`Checking ${file}`, { fileName });
      if (fileName && !file.includes(fileName)) {
        console.log(`Skipping ${file}`);
        continue;
      }
      const filePath = path.join(appDataPath, file);

      console.log(`Indexing ${filePath}`);

      // Check if the file is a PDF
      if (file.endsWith('.pdf')) {
        // Call the indexPdf function with the file path
        const result = await indexPdf(filePath, fileName);

        if (result.success) {
          console.log(`Indexed ${filePath}`);
          graph = result.graph;
        } else {
          console.error(`Failed to index ${filePath}: ${result.message}`);
        }
      }
    }
    console.log('Done indexing PDFs');
    return { success: true };
  } catch (error) {
    console.error('Error indexing PDFs:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('get-all-books', () => {
  console.log('get-all-books');
  return db.getBooks()
});

function createPdfViewerWindow(pdfPath: string) {
  const view1 = new WebContentsView()
  // Add newly created windows to childWindows array
  childWindows.push(view1);
}


// ipcMain.handle('create-new-webview-and-load-pdf', async (event, fileName: string) => {
//   console.log('create-new-webview-and-load-pdf fileName:', fileName);
//   try {
//     // Get app data directory
//     const appDataPath = path.join(app.getPath('userData'), 'pdfs');

//     console.log('appDataPath:', appDataPath);

//     // Get all files in the directory
//     const files = fs.readdirSync(appDataPath);

//     const absolutePath = path.join(appDataPath, fileName);

//     console.log('absolutePath:', absolutePath);

//     createPdfViewerWindow(absolutePath);

//     return { success: true, filePath: absolutePath, fileName: fileName };


//   } catch (error) {
//     console.error('Error creating new webview and loading PDF:', error);
//     return { success: false, message: error.toString() };
//   }
// });


ipcMain.handle('get-rag-instance', async (event, fileName: string) => {
  try {
    if (fileName !== currentRagInstance) {
      console.log('Graph not initialized');
      const result = await loadVectorStoreAndGraph(fileName);
      // console.log('result:', result);
      graph = result.graph;
      currentRagInstance = fileName;
      return {
        success: true,
        message: 'RAG instance created',
      }
    } else {
      console.log('RAG instance already exists');
      return { success: true, message: 'RAG instance already exists' };

    }

  } catch (error) {
    console.error('Error asking the RAG:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('ask-the-rag', async (event, question: string) => {
  try {
    if (!graph) {
      console.log('Graph not initialized');
      return;
    } else {
      let inputs = { question };

      const result = await graph.invoke(inputs);
      console.log('answer:', result.answer);
      return {
        success: true,
        message: 'Asked the RAG',
        answer: result.answer
      };
    }
  } catch (error) {
    console.error('Error asking the RAG:', error);
  }
})

ipcMain.handle('save-user-settings', async (event, userSettings: any) => {
  console.log('save-user-settings apiKey:', userSettings);
  db.saveUserSettings(userSettings);
  await initLLM(userSettings.model, userSettings.modelType);
  return { success: true, message: 'User settings saved successfully' };
});

ipcMain.handle('get-user-settings', () => {
  console.log('get-user-settings');
  return db.getUserSettings();
});


ipcMain.handle('get-ollama-models', async (event) => {
  let res = await new Promise((resolve, reject) => {
    exec('/usr/local/bin/ollama list', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(stderr);
      }

      const lines = stdout.trim().split('\n');
      let modelNames = lines.map(line => line.split(' ')[0]).slice(1);
      console.log('ollama models:', modelNames);
      resolve(modelNames);
    });
  });


  console.log('ollama models:', res);
  return res
});


ipcMain.handle('get-embeddings', async (event, text: string) => {
  console.log('get-embeddings');
  // return await getEmbeddings(text);
});


ipcMain.handle('check-if-ollama-model-installed', async () => {
  console.log('[check-if-ollama-model-installed]');
  let response = {
    success: false,
    message: ''
  };

  let res = await new Promise((resolve, reject) => {
    exec('/usr/local/bin/ollama list', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(JSON.stringify({ success: false, message: error }));
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(JSON.stringify({ success: false, message: stderr }));
      }

      resolve(stdout);

    })
  });

  console.log('--------- ollama models: ---------', res);

  return { success: true };
});

ipcMain.handle('get-system-settings', async () => {
  console.log('get-system-settings');
  return db.getSystemSettings();
});

ipcMain.handle('save-system-settings', async (event, systemSettings: any) => {
  console.log('save-system-settings called :: ', systemSettings);
  db.saveSystemSettings(systemSettings);
  return { success: true, message: 'System settings saved successfully' };
});

ipcMain.handle('delete-book', async (event, fileName: string) => {
  console.log('delete-book');
  try {
    // Get app data directory
    const appDataPath = path.join(app.getPath('userData'), 'pdfs');
    const vectorDbIndexPath = path.join(app.getPath('userData'), 'vectordb');

    console.log('appDataPath:', appDataPath);

    // Get all files in the directory
    const files = fs.readdirSync(appDataPath);
    const indexFolders = fs.readdirSync(vectorDbIndexPath);

    console.log('files:', files);

    // Iterate through each file and index it
    for await (const file of files) {
      console.log(`Checking ${file}`, { fileName });
      if (fileName && !file.includes(fileName)) {
        console.log(`Skipping ${file}`);
        continue;
      }
      const filePath = path.join(appDataPath, file);

      console.log(`Deleting ${filePath}`);

      // Check if the file is a PDF
      if (file.endsWith('.pdf')) {
        // Call the indexPdf function with the file path
        fs.unlinkSync(filePath);
      }
    }

    // delete folder having the same name as the fileName
    for await (const folder of indexFolders) {
      console.log(`Checking ${folder}`, { fileName });
      if (fileName && !folder.includes(fileName)) {
        console.log(`Skipping ${folder}`);
        continue;
      }
      const folderPath = path.join(vectorDbIndexPath, folder);
      console.log(`Deleting ${folderPath}`);
      fs.rmdirSync(folderPath, { recursive: true });
    }

    db.deleteBook(fileName);

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('load-pdf-in-pdf-window', async (event, fileName: string) => {
  console.log('load-pdf-in-pdf-window');
  try {
    // Get app data directory
    const appDataPath = path.join(app.getPath('userData'), 'pdfs'); 

    console.log('appDataPath:', appDataPath);

    // Get all files in the directory
    const files = fs.readdirSync(appDataPath);

    const absolutePath = path.join(appDataPath, fileName);

    console.log('absolutePath:', absolutePath);

    pdfWindow.webContents.loadFile(absolutePath);

    return { success: true, filePath: absolutePath, fileName: fileName };
  } catch (error) {
    console.error('Error creating new webview and loading PDF:', error);
    return { success: false, message: error.toString() };
  }
});
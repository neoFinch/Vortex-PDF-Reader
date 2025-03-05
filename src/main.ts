import { app, BaseWindow, BrowserWindow, dialog, ipcMain, WebContentsView } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'node:fs';
import { indexPdf, loadVectorStoreAndGraph } from './backend/rag';
import { DB, dbSchema } from './backend/db';
import { CompiledStateGraph, StateDefinition, StateGraph } from '@langchain/langgraph';


// const simpleJsonDbPath = path.join(app.getPath('userData'), 'simple-json-db.json');
// if (!fs.existsSync(simpleJsonDbPath)) {
//   fs.writeFileSync(simpleJsonDbPath, JSON.stringify({ books: [] }, null, 2));
// }
// const simpleJsonDb: dbSchema = JSON.parse(fs.readFileSync(simpleJsonDbPath, 'utf-8'));

// console.log('simpleJsonDb:', simpleJsonDb);

let graph: any | null = null;
const db = new DB();
db.init();
// use this variable for book keeping to know which rag instance is currently active
let currentRagInstance = '';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app. 
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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
  return db.books
});


ipcMain.handle('create-new-webview-and-load-pdf', async (event, fileName: string) => {
  console.log('create-new-webview-and-load-pdf fileName:', fileName);
  try {
    // Get app data directory
    const appDataPath = path.join(app.getPath('userData'), 'pdfs');

    console.log('appDataPath:', appDataPath);

    // Get all files in the directory
    const files = fs.readdirSync(appDataPath);

    const absolutePath = path.join(appDataPath, fileName);

    console.log('absolutePath:', absolutePath);


    // const win = new BaseWindow({ width: 800, height: 400 })



    // const view1 = new WebContentsView()
    // view1.webContents.loadFile(absolutePath)
    // view1.setBounds({ x: 0, y: 0, width: 800, height: 400 })
    // win.contentView.addChildView(view1)



  } catch (error) {
    console.error('Error creating new webview and loading PDF:', error);
    return { success: false, message: error.toString() };
  }
});


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

ipcMain.handle('save-user-settings', async (event, apiKey: string) => {
  console.log('save-user-settings apiKey:', apiKey);
  db.saveUserSettings(apiKey);
  return { success: true, message: 'User settings saved successfully' };
})
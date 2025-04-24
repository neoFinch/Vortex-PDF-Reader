// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getIpcRendererOn: () => ipcRenderer.on,
  getAllBooks: () => ipcRenderer.invoke('get-all-books'),
  selectAndSavePdf: () => ipcRenderer.invoke('select-and-save-pdf'),
  indexPdf: async (fileName: string) => {
    console.log('[PRELOAD] indexPdf fileName:', fileName);
    return await ipcRenderer.invoke('index-pdf', fileName)
  },
  // createNewWebViewAndLoadPDF: (fileName: string) => {
  //   console.log('[PRELOAD] createNewWebViewAndLoadPDF fileName:', fileName);
  //   return ipcRenderer.invoke('create-new-webview-and-load-pdf', fileName)
  // },
  getRagInstance: async (fileName: string) => {
    console.log('[PRELOAD] getRagInstance fileName:', fileName);
    return await ipcRenderer.invoke('get-rag-instance', fileName)
  },
  askTheRag: async (question: string) => {
    console.log('[PRELOAD] askTheRag question:', question);
    return await ipcRenderer.invoke('ask-the-rag', question)
  },
  saveUserSettings: (userSettings: any) => {
    console.log('[PRELOAD] saveUserSettings :', userSettings);
    return ipcRenderer.invoke('save-user-settings', userSettings)
  },
  getUserSettings: () => {
    console.log('[PRELOAD] getUserSettings');
    return ipcRenderer.invoke('get-user-settings')
  },
  getOllamaModels: () => {
    console.log('[PRELOAD] getOllamaModels');
    return ipcRenderer.invoke('get-ollama-models')
  },
  getEmbeddings: (text: string) => {
    console.log('[PRELOAD] getEmbeddings');
    return ipcRenderer.invoke('get-embeddings', text) 
  },
  checkIfOllamaModelInstalled: () => {
    console.log('[PRELOAD] checkIfOllamaModelInstalled');
    return ipcRenderer.invoke('check-if-ollama-model-installed')
  },
  getSystemSettings: () => {
    console.log('[PRELOAD] getSystemSettings');
    return ipcRenderer.invoke('get-system-settings')
  },
  saveSystemSettings: (systemSettings: any) => {
    console.log('[PRELOAD] saveSystemSettings');
    return ipcRenderer.invoke('save-system-settings', systemSettings)
  },
  deleteBook: (fileName: string) => {
    console.log('[PRELOAD] deleteBook');
    return ipcRenderer.invoke('delete-book', fileName)
  },
  // getRagStreamResponse: (callback) => {
  //   console.log('[PRELOAD] getRagStreamResponse');
  //   return ipcRenderer.on('rag-stream-response', (event, response) => {
  //     console.log('[PRELOAD] getRagStreamResponse response:', response);
  //     callback(response)
  //     // return response;
  //   })
  // }
  loadPdfInPdfWindow: (fileName: string) => {
    console.log('[PRELOAD] loadPdfInPdfWindow');
    return ipcRenderer.invoke('load-pdf-in-pdf-window', fileName)
  },
})


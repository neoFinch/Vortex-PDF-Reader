// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { c } from "vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P";

contextBridge.exposeInMainWorld("electronAPI", {
  getAllBooks: () => ipcRenderer.invoke('get-all-books'),
  selectAndSavePdf: () => ipcRenderer.invoke('select-and-save-pdf'),
  indexPdf: async (fileName: string) => {
    console.log('[PRELOAD] indexPdf fileName:', fileName);
    return await ipcRenderer.invoke('index-pdf', fileName)
  },
  createNewWebViewAndLoadPDF: (fileName: string) => {
    console.log('[PRELOAD] createNewWebViewAndLoadPDF fileName:', fileName);
    ipcRenderer.invoke('create-new-webview-and-load-pdf', fileName)
  },
  getRagInstance: async (fileName: string) => {
    console.log('[PRELOAD] getRagInstance fileName:', fileName);
    return await ipcRenderer.invoke('get-rag-instance', fileName)
  },
  askTheRag: async (question: string) => {
    console.log('[PRELOAD] askTheRag question:', question);
    return await ipcRenderer.invoke('ask-the-rag', question)
  },
  saveUserSettings: (apiKey: string) => {
    console.log('[PRELOAD] saveUserSettings apiKey:', apiKey);
    return ipcRenderer.invoke('save-user-settings', apiKey)
  },
  getUserSettings: () => {
    console.log('[PRELOAD] getUserSettings');
    return ipcRenderer.invoke('get-user-settings')
  }
})


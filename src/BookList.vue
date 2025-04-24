<script setup>
import { reactive, ref, onMounted } from 'vue';
import ChatModal from './components/ChatModal.vue';
import {useToast} from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
// import PdfViewer from './components/PdfViewer.vue';

const $toast = useToast();
const books = ref([])
const isIndexing = ref(false);
const indexingError = ref(null);
const showChatModal = ref(false);
const showingChatForBook = ref(null);
// const isPDFVisible = ref(false);
const pdfLocalPath = ref('');

const handleViewBook = async (fileName) => {
  console.log('handleViewBook', fileName);
  let data = await window.electronAPI.loadPdfInPdfWindow(fileName);
  console.log('handleViewBook data:', data);
  pdfLocalPath.value = data.filePath;
}

const deleteBook = async (fileName) => {
  try {
    console.log('[RENDERER] deleteBook selectedFile:', fileName);
    const result = await window.electronAPI.deleteBook(fileName);

    console.log('[RENDERER] deleteBook result:', result);
    if (result.success) {
      console.log('Delete successful');
      $toast.success('Delete Successful')
      refresh()
    } else {
      indexingError.value = result.message || 'Failed to delete book';
    }
  } catch (err) {
    indexingError.value = err.toString();
  } finally {
    isIndexing.value = false;
  }
}

async function indexPdf(fileName) {
  isIndexing.value = true;
  indexingError.value = null;

  try {
    console.log('[RENDERER] indexPdf selectedFile:', fileName);
    const result = await window.electronAPI.indexPdf(fileName);

    console.log('[RENDERER] indexPdf result:', result);
    if (result.success) {
      console.log('Indexing successful');
      $toast.success('Indexing Successful')
      refresh()
    } else {
      indexingError.value = result.message || 'Failed to index PDF';
    }
  } catch (err) {
    indexingError.value = err.toString();
  } finally {
    isIndexing.value = false;
  }
}

const refresh = async () => {
  try {
    const data = await window.electronAPI.getAllBooks();
    console.log('window.electronAPI:', data);
    // Replace the entire array with new data
    books.value = data;
  } catch (error) {
    console.error('Error fetching books:', error);
  }
}

const handleCloseChatModal = () => {
  console.log('handleCloseChatModal');
  showChatModal.value = false;
}

onMounted(async () => {
  try {
    const data = await window.electronAPI.getAllBooks();
    console.log('window.electronAPI:', data);
    // Replace the entire array with new data
    books.value = data;
  } catch (error) {
    console.error('Error fetching books:', error);
  }
})
</script>

<template>
  <div class="flex flex-col p-4 w-full">
    <h1 class="w-full text-primary text-2xl mb-8 flex gap-2">
      My Books
      <button @click="refresh" class="bg-accent text-black px-1 py-0 rounded-sm text-xs cursor-pointer">
        Refresh
      </button>
    </h1>
    <div class="w-full">
      <div class="t-head flex justify-between w-full items-center border-b border-gray-400 py-4">
        <div class="text-gray-400 mr-4 w-6/12">Title</div>
        <div class="text-gray-400 mr-4 w-2/12">Status</div>
        <div class="text-gray-400 mr-4 w-4/12 flex justify-end">Actions</div>
      </div>
      <div class=" text-gray-400 flex justify-between w-full items-center border-b py-4" v-for="book in books"
        :key="book.title">
        <p class="text-gray-400 mr-4 w-6/12">{{ book.title }}</p>
        <p class="text-gray-400 mr-4 w-2/12">{{ book.indexingStatus }}</p>
        <div class="text-gray-400 mr-4 w-4/12 flex justify-end gap-1">
          <button @click="handleViewBook(book.title)" class="bg-accent text-black p-1 rounded-sm cursor-pointer">
            View
          </button>
          <button
            @click="showChatModal = true; showingChatForBook = book.title"
            class="bg-accent text-black p-1 rounded-sm cursor-pointer">
            Chat
          </button>
          <button @click="indexPdf(book.title)" class="bg-accent text-black p-1 rounded-sm cursor-pointer">
            Index
          </button>
          <button @click="deleteBook(book.title)" class="bg-accent text-black p-1 rounded-sm cursor-pointer">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showChatModal" 
    class="chat-modal fixed top-0 left-0 w-screen h-screen  flex justify-center z-10">
    <ChatModal class="animate__animated animate__fadeIn animate__delay-0.2s" :book-title="showingChatForBook" @klose="handleCloseChatModal" />
  </div>
  
</template>


<style scoped>
  button:hover {
    background-color: #BF754B;
  }

</style>
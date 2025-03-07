<script setup>
import { reactive, ref, onMounted } from 'vue';
import ChatModal from './components/ChatModal.vue';
import {useToast} from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const $toast = useToast();
const books = ref([])
const isIndexing = ref(false);
const indexingError = ref(null);
const showChatModal = ref(false);
const showingChatForBook = ref(null);

const handleViewBook = (fileName) => {
  console.log('handleViewBook', fileName);
  window.electronAPI.createNewWebViewAndLoadPDF(fileName);
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
    <h1 class="w-full text-emerald-500 text-2xl mb-8">
      My Books
      <button @click="refresh" class="bg-secondary text-black p-1 rounded-sm text-xs cursor-pointer">
        Refresh
      </button>
    </h1>
    <div class="w-full">
      <div class="t-head flex justify-between w-full items-center border-b border-gray-400 py-4">
        <div class="text-gray-400 mr-4 w-6/12">Title</div>
        <div class="text-gray-400 mr-4 w-2/12">Status</div>
        <div class="text-gray-400 mr-4 w-4/12 flex justify-end">Actions</div>
      </div>
      <div class="text-gray-400 flex justify-between w-full items-center border-b py-4" v-for="book in books"
        :key="book.title">
        <p class="text-gray-400 mr-4 w-6/12">{{ book.title }}</p>
        <p class="text-gray-400 mr-4 w-2/12">{{ book.indexingStatus }}</p>
        <div class="text-gray-400 mr-4 w-4/12 flex justify-end gap-1">
          <button @click="handleViewBook(book.title)" class="bg-secondary text-black p-1 rounded-sm cursor-pointer">
            View
          </button>
          <button
            @click="showChatModal = true; showingChatForBook = book.title"
            class="bg-secondary text-black p-1 rounded-sm cursor-pointer">
            Chat
          </button>
          <button @click="indexPdf(book.title)" class="bg-secondary text-black p-1 rounded-sm cursor-pointer">
            Index
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showChatModal" 
    class="fixed top-0 left-0 w-screen h-screen bg-gray-800 flex justify-center z-10">
    <ChatModal :book-title="showingChatForBook" @klose="handleCloseChatModal" />
  </div>
</template>


<style scoped>
  button:hover {
    background-color: #BF754B;
  }

</style>
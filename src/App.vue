<script setup>
import { ref } from 'vue';
import HomeSvg from './assets/images/home.svg';
import BookList from './BookList.vue';
import Settings from './components/Settings.vue';
import {useToast} from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const $toast = useToast();
const isLoading = ref(false);
const isIndexing = ref(false);
const indexingError = ref(null);
const selectedFile = ref(null);
const error = ref(null);
const position = 'bottom';
const currentTab = ref('home');

async function selectPdf() {
  isLoading.value = true;
  error.value = null;

  try {
    // Call the exposed IPC method from preload
    const result = await window.electronAPI.selectAndSavePdf();

    if (result.success) {
      selectedFile.value = result;
    } else {
      error.value = result.message || 'Failed to save PDF';
    }
  } catch (err) {
    error.value = err.toString();
  } finally {
    isLoading.value = false;
  }
}

async function indexPdf() {
  isIndexing.value = true;
  indexingError.value = null;

  try {
    console.log('[RENDERER] indexPdf selectedFile:', selectedFile.value.fileName);
    const result = await window.electronAPI.indexPdf(selectedFile.value.fileName);

    // console.log('[RENDERER] indexPdf result:', result);
    if (result.success) {
      console.log('Indexing successful');
      selectedFile.value = null;
      let instance = $toast.success('Indexing successful');
    } else {
      indexingError.value = result.message || 'Failed to index PDF';
    }
  } catch (err) {
    indexingError.value = err.toString();
  } finally {
    isIndexing.value = false;
  }
}

function check() {
  console.log('Check button clicked');
}

const items = [
  { label: 'Home', icon: HomeSvg },
  { label: 'Calendar', icon: HomeSvg },
];

</script>


<template>
  <main class="relative">
    <section v-if="currentTab === 'home'" class="flex items-center min-h-screen relative bg-gray-70">
      <div class="p-2 text-gray-100 flex flex-wrap w-full justify-center">
        <div @click="selectPdf" :disabled="isLoading"
          class="flex border border-green-300 rounded-md w-2/3 mb-8 text-center justify-center cursor-pointer p-8">
          <div class="flex uppercase text-gray-400">
            {{ isLoading ? 'Selecting...' : 'Select PDF' }}
          </div>
        </div>
        <div v-if="selectedFile" class="file-info mb-8 w-2/3">
          <p>
            <span class="text-emerald-400">Selected file:</span>
            {{ selectedFile.fileName }}
          </p>
          <p>
            <span class="text-emerald-400">Saved at:</span>
            {{ selectedFile.filePath }}
          </p>
        </div>

        <p v-if="error" class="error">Error: {{ error }}</p>

        <div v-if="selectedFile" class="flex justify-center w-full flex-wrap">
          <div class="flex flex-col items-center w-full p-2" v-if="isIndexing">
            <div class="loader">
              <div role="status">
                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#ffb900" />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="#1e2938" />
                </svg>
                <span class="sr-only">Loading...</span>
              </div>
            </div>
            <p class="text-amber-400 text-sm">Indexing PDF...</p>
          </div>
          <button @click="indexPdf" v-if="!isIndexing" :disabled="isIndexing"
            class="bg-emerald-400 text-black p-2 rounded-sm">
            Start Indexing
          </button>
        </div>
      </div>

    </section>

    <section v-if="currentTab === 'my-books'" class="flex min-h-screen relative bg-gray-70 flex-wrap">
      <BookList />
    </section>

    <section v-if="currentTab === 'settings'" class="flex min-h-screen relative bg-gray-70 flex-wrap">
      <Settings />
    </section>


    <div class="absolute bottom-0 flex gap-4 justify-center bg-gray-900 w-full pt-4 pb-0 rounded-t-4xl">
      <button @click="currentTab = 'home'" :class="{
        'bg-emerald-400 text-black px-4 py-2 rounded-t-2xl': currentTab === 'home',
        'text-gray-400 px-4 py-2': currentTab !== 'home'
      }">
        Home
      </button>


      <button @click="currentTab = 'my-books'" :class="{
        'bg-emerald-400 text-black px-4 py-2 rounded-t-2xl': currentTab === 'my-books',
        'text-gray-400 px-4 py-2': currentTab !== 'my-books'
      }">
        My Books
      </button>

      <button @click="currentTab = 'settings'" :class="{
        'bg-emerald-400 text-black px-4 py-2 rounded-t-2xl': currentTab === 'settings',
        'text-gray-400 px-4 py-2': currentTab !== 'settings'
      }">
        Settings
      </button>
    </div>
  </main>
</template>

<style scoped>
  button {
    cursor: pointer;
  }
</style>

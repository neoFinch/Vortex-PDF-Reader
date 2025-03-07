<script setup>
import { onMounted, ref } from 'vue';
import Loader from './Loader.vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import { VMarkdownView } from 'vue3-markdown'
import 'vue3-markdown/dist/style.css'

const $toast = useToast();
const chat = ref([]);
const isLoading = ref(false);

const props = defineProps({
  bookTitle: String,
})

const emit = defineEmits(['klose'])

const handleCloseModal = () => {
  console.log('handleCloseModal');
  emit('klose');
}

const handleKeyUp = async (event) => {

  if (event.key === 'Enter') {
    let question = event.target.value;
    chat.value.push({ user: 'You', message: question });
    event.target.value = ''
    isLoading.value = true;
    await window.electronAPI.askTheRag(question).then(result => {
      console.log('askTheRag result:', result);
      isLoading.value = false;
      if (result.success) {
        chat.value.push({ user: 'System', message: result.answer });
      } else {
        console.error('Error asking the RAG:', result.message);
      }
    });
  }
}

onMounted(() => {

  console.log('mounted', { title: props.bookTitle });
  window.electronAPI.getRagInstance(props.bookTitle).then(result => {
    console.log('getRagInstance result:', result);
    if (result.success) {
      console.log('RAG instance created');
      $toast.success('RAG instance created');
    } else {
      console.error('Error creating RAG instance:', result.message);
    }
  });
})

</script>


<template>
  <div class="flex flex-col p-4 w-full">
    <div class="flex w-full justify-end">
      <button @click="handleCloseModal" class="bg-primary text-black p-1 rounded-sm text-xs cursor-pointer">
        Close
      </button>
    </div>
    <div class="flex justify-start w-full flex-wrap mb-2">
      <h1 class="w-full text-emerald-500 text-2xl mb-2">Let's Dig Deeper</h1>
      <h2 class="text-gray-300">
        Learning about : <span class="text-emerald-400">{{ bookTitle }}</span>
      </h2>
    </div>
    <section class="chat-window  relative flex flex-col overflow-y-auto">
      <div class="chat-window-body flex flex-col w-full bg-gray-900 mb-2 border-gray-400 rounded-md p-2">
        <div v-for="message in chat" :key="message.user" class="w-full flex mb-2"
          :class="message.user === 'You' ? 'justify-end' : ''">
          <div :class="message.user === 'You' ?
            'bg-secondary w-fit p-2 rounded-lg w-2-3rd'
            : 'bg-secondary w-fit p-2 rounded-lg w-2-3rd'">
            <p class="text-gray-100 text-sm w-full font-bold">
              <!-- {{ message.message }} -->
              <VMarkdownView :content="message.message"/>
            </p>
          </div>
        </div>
        <div v-if="isLoading" class="w-full flex mb-2">
          <div class="bg-gray-800 w-fit p-1 rounded-lg">
            <Loader />
          </div>
        </div>
      </div>
      <div class="chat-window-footer flex justify-between w-full absolute bottom-0 bg-gray-800">
        <input @keyup="handleKeyUp" type="text"
          class="search-box w-full p-2 bg-gray-900 border-b border-gray-400 rounded-md text-gray-400"
          placeholder="Type your message here...">
      </div>
    </section>
  </div>
</template>

<style scoped>
.chat-window {
  min-height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
}

.chat-window-body {
  height: calc(100vh - 170px);
  overflow-y: auto;
}

.search-box:focus {
  border-bottom: 1px solid #00bc7d;
  outline: none;
}

.markdown-body {
  background-color: transparent;
}

.w-2-3rd {
  max-width: 66.66%;
  width: fit-content
}
</style>
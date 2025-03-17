<script setup>
import { checkIfEmbeddingModel } from '../utils/helpers';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';

let isOllamaInstalled = ref(false);
let llmModel = ref('gpt-4o-mini');
let apiKey = ref('');
let setupType = ref('local');
let router = useRouter();
let $toast = useToast();
const localModels = ref([]);
const localEmbeddingModels = ref([]);

const selectedLocalModel = ref('');
const selectedEmbeddingModel = ref('');

console.log('onboarding.vue');


const refresh = async () => {
  try {
    const data = await window.electronAPI.checkIfOnboardingDone();
    console.log('window.electronAPI:', data);
    // Replace the entire array with new data
    isOllamaInstalled.value = data.success;
  } catch (error) {
    console.error('Error fetching books:', error);
  }
}

const saveApiKey = async () => {
  console.log('saveApiKey', apiKey.value);
  let resopnse = await window.electronAPI.saveUserSettings({ apiKey: apiKey.value, model: llmModel.value, modelType: 'cloud' });
  console.log('saveUserSettings resopnse:', resopnse);

  let resSystemSettings = await window.electronAPI.saveSystemSettings({ onboardingDone: true, usageType: 'cloud' });
  console.log('saveSystemSettings resopnse:', resSystemSettings);

  if (resopnse.success) {
    $toast.success('Saved successfully');
    // router.push('/');
  }
}

const saveLocalSettings = async () => {
  console.log('saveLocalSettings');
  window.electronAPI.saveUserSettings({
    apiKey: '',
    model: selectedLocalModel.value,
    modelType: 'local',
    embeddingModel: selectedEmbeddingModel.value
  }).then(async (res) => {
    
  }).catch(err => {
    console.log('err:', err);
  }).finally(() => {
    window.electronAPI.saveSystemSettings({ onboardingDone: true, usageType: 'local' });

    $toast.success('Saved successfully');
    router.push('/');
  });



}



onMounted(async () => {
  let systemSettings;
  try {
    systemSettings = await window.electronAPI.getSystemSettings();
  } catch (error) {
    console.error('Error getting system settings:', error);
  }

  console.log('systemSettings:', systemSettings);

  window.electronAPI.checkIfOllamaModelInstalled().then(result => {
    console.log('checkIfOllamaModelInstalled result:', result);
    isOllamaInstalled.value = result.success;

  }).catch(err => {
    console.log('[Onboarding.vue] error seems ollama not installed', err);
    isOllamaInstalled.value = false;
  });

  window.electronAPI.getUserSettings().then(result => {
    console.log('getUserSettings result:', result);

    selectedLocalModel.value = result.model;
    selectedEmbeddingModel.value = result.embeddingModel;

  }).catch(err => {
    console.log('[Onboarding.vue] Error getting user settings', err);
  });


  window.electronAPI.getOllamaModels().then(result => {
    console.log('getOllamaModels result:', result);
    let temp = result.filter(model => !checkIfEmbeddingModel(model))
    console.log('temp:', temp);
    localModels.value = result.filter(model => !checkIfEmbeddingModel(model));
    localEmbeddingModels.value = result.filter(model => checkIfEmbeddingModel(model));
  })


});
</script>


<template>

  <div class="flex flex-col px-12 py-8 w-full text-gray-400">
    <h1 class="text-center text-2xl">Vortex - Learning Accelerator</h1>
    <div class="w-full flex gap-1 border-b border-green-500 my-4 ">
      <div :class="setupType === 'local' ?
        'rounded-t-sm bg-accent text-black border border-green-500 px-4 py-1 cursor-pointer'
        : 'rounded-t-sm border border-gray-500 px-4 py-1 text-gray-500 cursor-pointer'" @click="setupType = 'local'">
        Local Setup
      </div>
      <div :class="setupType === 'cloud' ?
        'rounded-t-sm bg-accent text-black border border-green-500 px-4 py-1 cursor-pointer' :
        'rounded-t-sm border border-gray-500 px-4 py-1 text-gray-500 cursor-pointer'" @click="setupType = 'cloud'">
        Cloud Setup
      </div>
    </div>
    <!-- <h1 class="w-full text-primary text-2xl mb-8">Hello, There!!!</h1> -->
    <!-- <h2 class="text-gray-300 text-lg">
      Welcome to the AI powered PDF Reader.
    </h2> -->
    <!-- <h2 class="text-xl">
      Let's get started!
    </h2> -->

    <div v-if="setupType === 'local'">
      <div v-if="!isOllamaInstalled" class="flex flex-col gap-4 py-4 w-full">
        <h3 class="text-red-400 border border-red-500 rounded-md p-2 w-fit">
          Seems like you don't have ollama installed on your system.
        </h3>
        <h3>Vortex Learning Accelerator depends on ollama models, follow the steps</h3>
        <h3 class=" py-2 w-fit ">
          <span class="text-accent-2">Step 1 </span>: Goto
          <span class="text-blue-300"> https://ollama.com/download</span>
          and download the ollama binary for your operating system.
        </h3>
        <h3>
          <span class="text-accent-2"> Step 2 </span> Models and embedding models.
          <ul>
            <li class="px-4 text-primary">1. Embedding Model</li>
            <ul class="px-8 py-2">
              <table class="w-full">
                <thead class="border">
                  <tr>
                    <td class="border w-1/3">Name</td>
                    <td>Link</td>
                  </tr>
                </thead>
                <tbody class="border">
                  <tr>
                    <td class="border">nomic-embed-text</td>
                    <td><span class="text-blue-400">https://ollama.com/library/nomic-embed-text</span></td>
                  </tr>
                </tbody>
              </table>
            </ul>
            <li class="px-4 text-primary">2. LLM Model <span class="text-gray-500">[install any one]</span></li>
            <ul class="px-8 py-2">
              <table class="w-full">
                <thead class="border">
                  <tr>
                    <td class="border w-1/3">Name</td>
                    <td>Link</td>
                  </tr>
                </thead>
                <tbody class="border">
                  <tr>
                    <td class="border">llama3.3</td>
                    <td><span class="text-blue-400">https://ollama.com/library/llama3.3</span></td>
                  </tr>
                  <tr>
                    <td class="border">deepseek-r1</td>
                    <td class="border"><span class="text-blue-400">https://ollama.com/library/deepseek-r1</span></td>
                  </tr>
                </tbody>
              </table>
            </ul>
          </ul>
        </h3>
        <div class="flex justify-start w-full flex-col gap-4">
          <h3>Once done, click below to verify if ollama is installed on your system.</h3>
          <button @click="refresh" class=" w-fit px-4 bg-accent text-black p-1 rounded-sm cursor-pointer">
            Check
          </button>
        </div>
      </div>

      <div v-if="isOllamaInstalled" class="flex flex-col gap-4 py-4 w-full">
        <h3 class="text-green-400 border border-green-500 rounded-md p-2 w-fit">
          Great! Ollama is installed on your system.
        </h3>
        <div class="flex flex-wrap gap-2">
          <label for="" class="text-gray-400 text-sm">Select Model</label>
          <select v-model="selectedLocalModel" class="border border-gray-400 text-gray-400 w-full rounded-md p-2">
            <option value="">Select Model</option>
            <option v-for="model in localModels" :key="model" :value="model">{{ model }}</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-2">
          <label for="" class="text-gray-400 text-sm">Select Embedding Model</label>
          <select v-model="selectedEmbeddingModel" class="border border-gray-400 text-gray-400 w-full rounded-md p-2">
            <option value="">Select Embedding Model</option>
            <option v-for="model in localEmbeddingModels" :key="model" :value="model">{{ model }}</option>
          </select>
        </div>
        <div class="flex justify-start w-full flex-col gap-4 mt-4">
          <button @click="saveLocalSettings" class="w-fit px-4 bg-accent text-black p-1 rounded-sm cursor-pointer">
            Save
          </button>
        </div>
      </div>


    </div>


    <div v-if="setupType === 'cloud'">
      <h3 class="text-gray-400 w-full">
        I don't want a pure local solution. I want to use ChatGPT API Key.
      </h3>
      <div class="mt-8">
        <div class="flex flex-col gap-4 py-4 w-full">
          <label for="" class="text-gray-400 text-sm">Select Model</label>
          <select v-model="llmModel" class="border border-gray-400 text-gray-400 w-full rounded-md p-2">
            <option value="gpt-4o-mini">Gpt-4o-Mini</option>
            <option value="gpt-4">Gpt-4</option>
          </select>
        </div>


      </div>
      <div class="flex justify-start w-full flex-col gap-4 mt-8">
        <label for="" class="text-gray-400 text-sm">ChatGPT API Key</label>
        <input v-model="apiKey" class="border border-gray-400 text-gray-400 w-full rounded-md py-2 px-2" type="password"
          placeholder="Add ChatGPT API Key" />
      </div>
      <div class="flex justify-start w-full flex-col gap-4 mt-4">
        <button @click="saveApiKey" class="w-fit px-4 bg-accent text-black p-1 rounded-sm cursor-pointer">
          Save
        </button>
      </div>
    </div>
  </div>

</template>

<style scoped>
td {
  padding: 8px;
}
</style>
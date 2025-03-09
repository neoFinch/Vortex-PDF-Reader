<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

let apiKey = ref('');
let model = ref('');
let modelType = ref('select-model-type');
let $toast = useToast();
let modelList = ref([]);

const saveUserSettings = async () => {
  console.log('saveUserSettings', apiKey.value);
  let resopnse = await window.electronAPI.saveUserSettings({ apiKey: apiKey.value, model: model.value, modelType: modelType.value });
  console.log('saveUserSettings resopnse:', resopnse);
  $toast.success('Successfully saved user settings')
}

const handleChange = (event) => {
  console.log('handleChange', event.target.value);
  model.value = event.target.value;
}

const handleModelTypeChange = (event) => {
  console.log('handleModelTypeChange', event.target.value);
  modelType.value = event.target.value;
}

onMounted(async () => {
  let userSettings = await window.electronAPI.getUserSettings()
  apiKey.value = userSettings?.apiKey;
  modelList.value = await window.electronAPI.getOllamaModels();
  model.value = userSettings?.model;
  modelType.value = userSettings?.modelType;
})
</script>


<template>
  <div class="flex flex-col p-4 w-full">
    <h1 class="w-full text-emerald-500 text-2xl mb-8">
      Settings
    </h1>



    <div class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">Select Model Provider</label>
      <select v-on:change="handleModelTypeChange" v-model="modelType"
        class="border border-gray-400 text-gray-400 w-full rounded-md p-2" name="model-type">
        <option value="select-model-type">Select Model Type</option>
        <option value="cloud">Cloud</option>
        <option value="ollama">Ollama</option>
      </select>
    </div>
    
    <div v-if="modelType === 'cloud'" class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">Select Model</label>
      <select v-on:change="handleChange" class="border border-gray-400 text-gray-400 w-full rounded-md p-2">
        <option value="gpt-4o-mini">Gpt-4o-Mini</option>
        <option value="gpt-4">Gpt-4</option>
      </select>
    </div>


    <div v-if="modelType === 'cloud'" class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">OpenAI API Key</label>
      <input v-model="apiKey" class="border border-gray-400 text-gray-400 w-full rounded-md p-2" type="password"
        placeholder="Add OpenAI API Key" />
    </div>

    <div v-if="modelType === 'ollama'" class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">Select Model</label>
      <select v-on:change="handleChange" :value="model"
        class="border border-gray-400 text-gray-400 w-full rounded-md p-2" name="model">
        <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>


    <div class="flex justify-center w-full">
      <button @click="saveUserSettings" class="w-20 bg-accent p-2 rounded-sm cursor-pointer">
        Save
      </button>
    </div>
  </div>

</template>

<script setup>
import { onMounted, ref } from 'vue';
import {useToast} from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

let apiKey = ref('');
let model = ref('gpt-4o-mini');

let $toast = useToast()

const saveUserSettings = async () => {
  console.log('saveUserSettings', apiKey.value);
  let resopnse = await window.electronAPI.saveUserSettings(apiKey.value);
  console.log('saveUserSettings resopnse:', resopnse);
  $toast.success('Successfully saved user settings')
}

const handleChange = (event) => {
  console.log('handleChange', event.target.value);
  model.value = event.target.value;
}

onMounted(async() => {
  let userSettings = await window.electronAPI.getUserSettings()
  apiKey.value = userSettings.apiKey;
})
</script>


<template>
  <div class="flex flex-col p-4 w-full">
    <h1 class="w-full text-emerald-500 text-2xl mb-8">
      Settings
    </h1>

    <div class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">OpenAI API Key</label>
      <input v-model="apiKey" class="border border-gray-400 text-gray-400 w-full rounded-md p-2" type="password"
        placeholder="Add OpenAI API Key" />
    </div>

    
    <div class="flex flex-col gap-4 py-4 w-full">
      <label for="" class="text-gray-400 text-sm">Select Model</label>
      <select v-on:change="handleChange" :value="model" class="border border-gray-400 text-gray-400 w-full rounded-md p-2" name="model">
        <option value="gpt-4o-mini">Gpt-4o-Mini</option>
        <option value="ollama">Ollama</option>
      </select>
    </div>

    <div class="flex justify-center w-full">
      <button @click="saveUserSettings" class="w-20 bg-primary p-2 rounded-sm cursor-pointer">
        Save
      </button>
    </div>
  </div>

</template>

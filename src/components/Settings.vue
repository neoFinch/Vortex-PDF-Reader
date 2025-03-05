<script setup>
import { ref } from 'vue';


let apiKey = ref('');

const saveUserSettings = async () => {
  console.log('saveUserSettings', apiKey.value);
  let resopnse = await window.electronAPI.saveUserSettings(apiKey.value);
  console.log('saveUserSettings resopnse:', resopnse);
  
}
</script>


<template>
  <div class="flex flex-col p-4 w-full">
    <h1 class="w-full text-emerald-500 text-2xl mb-8">
      Settings
    </h1>

    <div class="flex flex-col gap-4 py-4 w-full">
      <input v-model="apiKey" class="border border-gray-400 text-gray-400 w-full rounded-md p-2" type="password"
        placeholder="Add OpenAI API Key" />
    </div>
    <div class="flex justify-center w-full">
      <button @click="saveUserSettings" class="w-20 bg-emerald-400 p-2 rounded-sm cursor-pointer">
        Save
      </button>
    </div>
  </div>

</template>

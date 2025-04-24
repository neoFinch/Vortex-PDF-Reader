<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(async () => {
  console.log('Home.vue mounted');
  let systemSettings;
  try {
    systemSettings = await window.electronAPI.getSystemSettings();
  } catch (error) {
    console.error('Error getting system settings:', error);
  }
  window.electronAPI.checkIfOllamaModelInstalled().then(result => {
    console.log('checkIfOllamaModelInstalled result:', result);
    console.log('systemSettings :: ', systemSettings)
    if (systemSettings.onboardingDone == false && result.success) {
      console.log('onboarding not done, redirecting to onboarding');
      console.log('onboarding not done');
      router.push('/onboarding');
    }
  }).catch(err => {
    console.log('error seems ollama not installed', err);
    router.push('/onboarding');
  })
})


</script>


<template>
  <div class="bg-dark text-white">
    <div class="p-2 w-full drag-region flex items-center justify-center gap-1">
      <div class="w-2 h-2 bg-gray-600 border border-gray-700 rounded-full"></div>
      <div class="w-2 h-2 bg-gray-600 border border-gray-700 rounded-full"></div>
      <div class="w-2 h-2 bg-gray-600 border border-gray-700 rounded-full"></div>
    </div>
    <!-- <h1>Current route path:</h1> -->
    <!-- <p>{{ $route.fullPath }}</p> -->
    <RouterView />
  </div>
</template>
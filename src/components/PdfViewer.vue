<template>
  <div class="pdf-viewer">
    <canvas ref="canvas"></canvas>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading PDF...</div>
    <div v-if="numPages > 1" class="controls">
      <button @click="prevPage" :disabled="pageNum <= 1">Prev</button>
      <span>Page {{ pageNum }} / {{ numPages }}</span>
      <button @click="nextPage" :disabled="pageNum >= numPages">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'


const props = defineProps({
  pdfPath: String // Path or URL to the PDF file
})

const canvas = ref(null)
const pdfDoc = ref(null)
const pageNum = ref(1)
const numPages = ref(0)
const loading = ref(false)
const error = ref(null)

import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const renderPage = async (num) => {
  loading.value = true
  error.value = null
  try {
    const page = await pdfDoc.value.getPage(num)
    const viewport = page.getViewport({ scale: 1.5 })
    const ctx = canvas.value.getContext('2d')
    canvas.value.height = viewport.height
    canvas.value.width = viewport.width
    await page.render({ canvasContext: ctx, viewport }).promise
  } catch (e) {
    error.value = 'Failed to render page: ' + e
  } finally {
    loading.value = false
  }
}

const loadPdf = async () => {
  if (!props.pdfPath) return
  loading.value = true
  error.value = null
  try {
    pdfDoc.value = await pdfjsLib.getDocument(props.pdfPath).promise
    numPages.value = pdfDoc.value.numPages
    pageNum.value = 1
    await renderPage(pageNum.value)
  } catch (e) {
    error.value = 'Failed to load PDF: ' + e
  } finally {
    loading.value = false
  }
}

const nextPage = async () => {
  if (pageNum.value < numPages.value) {
    pageNum.value++
    await renderPage(pageNum.value)
  }
}
const prevPage = async () => {
  if (pageNum.value > 1) {
    pageNum.value--
    await renderPage(pageNum.value)
  }
}

watch(() => props.pdfPath, loadPdf)
onMounted(loadPdf)
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 400px;
  background: #181d2a;
  border-radius: 8px;
  padding: 10px;
}
canvas {
  border: 1px solid #444;
  margin-bottom: 8px;
  background: #fff;
}
.controls {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.error {
  color: #f00;
  margin-top: 8px;
}
.loading {
  color: #aaa;
  margin-top: 8px;
}
</style>

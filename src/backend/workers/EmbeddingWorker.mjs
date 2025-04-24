import { workerData, parentPort} from "worker_threads"
import { pipeline } from '@xenova/transformers'

async function generateEmbeddings(text) {
  console.log('generateEmbeddings text:', text);
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const embeddings = await extractor(text, { pooling: 'mean', normalize: true });
  return embeddings.data;
}

parentPort.on("message", async (message) => {
  console.log('parentPort message:', message);
  // const { text } = message;
  const embeddings = await generateEmbeddings(message);
  console.log('parentPort embeddings:', embeddings);
  parentPort.postMessage(embeddings);
});

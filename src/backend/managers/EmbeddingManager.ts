import { OpenAIEmbeddings } from '@langchain/openai';
import { pipeline } from '@xenova/transformers'
import { XenovaEmbeddingManager } from '../wrappers/XenovaEmbeddingsWrapper';


export class EmbeddingManager {
  private static instance: OpenAIEmbeddings | any | null = null;
 
  static async getEmbeddingModel(type: "openai" | "xenova", apiKey?: string) {
    // if (!this.instance) {
      if (type === "openai") {
        this.instance = new OpenAIEmbeddings({ 
          model: "text-embedding-3-large", 
          apiKey: apiKey 
        });
      } else {
        try {
          this.instance = new XenovaEmbeddingManager();
          await this.instance.init();
        } catch (error) {
          console.error('Error initializing XenovaEmbeddingManager:', error);
        }
      } 
    // }

    return this.instance;

  }
}
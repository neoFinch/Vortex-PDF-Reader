export class XenovaEmbeddingManager {
  private model: any;

  async init() {
    console.log("Initializing embedding model...");
    const { pipeline } = await import('@xenova/transformers');
    console.log("Pipeline loaded:", pipeline);

    this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });

    console.log("Model initialized:", this.model);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.model) await this.init();
    console.log("Using model to embed documents...");
    return Promise.all(texts.map(async (text) => await this.model(text)));
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!this.model) await this.init();
    console.log("Using model to embed query...");
    return await this.model(text);
  }
}

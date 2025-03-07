
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { DB } from "../db";

export class LLMFactory {

  static createLLM(modelName: string) {
    let db = new DB();
    db.init();
    const apiKey = db.getAPIKey();

    switch (modelName) {
      case "gpt-4o-mini":
        return new ChatOpenAI({
          modelName: "gpt-4o-mini",
          temperature: 0.7,
          openAIApiKey: apiKey,
        });

      case "ollama":
        return new ChatOllama({
          model: "deepseek-r1:1.5b", 
          temperature: 0.7,
        });

      default:
        throw new Error(`Unsupported model: ${modelName}`);
    }
  }
}

// Example usage
// const llm = LLMFactory.createLLM("ollama");
// console.log("Using LLM:", llm);

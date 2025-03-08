
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { DB } from "../db";

export class LLMFactory {

  static createLLM(modelName: string, modelType: string) {
    let db = new DB();
    db.init();
    const apiKey = db.getAPIKey();

    switch (modelType) {
      case "cloud":
        return new ChatOpenAI({
          modelName: modelName,
          temperature: 0.7,
          openAIApiKey: apiKey,
        });

      case "ollama":
        return new ChatOllama({
          model: modelName, 
          temperature: 0.7,
        });

      default:
        console.log('defaulter - modelType:', modelType);
    }
  }
}

// Example usage
// const llm = LLMFactory.createLLM("ollama");
// console.log("Using LLM:", llm);

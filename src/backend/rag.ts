import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from 'node:path';
import { app } from 'electron';
// import { Chroma } from "@langchain/community/vectorstores/chroma";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config'
import { DB } from "./db";
import { ChatOllama } from "@langchain/ollama";


const db = new DB();
db.init();

let apiKey = db.getAPIKey()

let api_key = process.env.OPENAI_API_KEY ?? apiKey;

import log from 'electron-log/main';
log.initialize();

log.transports.file.resolvePathFn = () => path.join(path.join(app.getPath('userData')), 'logs/main.log');

console.log = log.log;




const vectorDbDir = path.join(app.getPath('userData'), 'vectordb');
console.log({ vectorDbDir })

/**
 * [Fuction to index a PDF file]
 * @param filePath 
 * @param fileName 
 * @returns 
 */
export const indexPdf = async (filePath: string, fileName: string) => {
	// console.log('indexPdf filePath:', filePath);

	// initialie embeddings
	const embeddings = new OpenAIEmbeddings({
		model: "text-embedding-3-large",
		apiKey: api_key
	});


	const vectorStore = new FaissStore(embeddings, {});

	const llm = new ChatOpenAI({
		model: "gpt-4o-mini",
		temperature: 0,
		apiKey: api_key
	});


	try {
		const loader = new PDFLoader(filePath);
		const docs = await loader.load();
		// console.log('Loaded PDF:', docs);

		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000, chunkOverlap: 200
		});

		const allSplits = await splitter.splitDocuments(docs);

		// console.log('Split PDF:', allSplits);

		await vectorStore.addDocuments(allSplits)

		// save to disk
		await vectorStore.save(`${vectorDbDir}/${fileName}`);

		// const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

		const promptTemplate = ChatPromptTemplate.fromTemplate(`
			You are an advanced AI assistant designed for question-answering tasks. Use the retrieved context to provide a detailed and well-structured response.
			
			If the retrieved context does not fully answer the question, acknowledge that and provide the best possible explanation based on available knowledge.
			
			### Question:  
			{question}  
			
			### Context:  
			{context}  
			
			### Answer:  
			- **Summary:** Provide a brief summary if applicable.  
			- **Key Details:** Elaborate on important points from the context.  
			- **Additional Insights:** Offer relevant background information if needed.  
			- **Sources:** Mention which parts of the context contributed to your response.  
			`);
			


		// Define state for application
		const InputStateAnnotation = Annotation.Root({
			question: Annotation<string>,
		});

		const StateAnnotation = Annotation.Root({
			question: Annotation<string>,
			context: Annotation<Document[]>,
			answer: Annotation<string>,
		});

		// Define application steps
		const retrieve = async (state: typeof InputStateAnnotation.State) => {
			const retrievedDocs = await vectorStore.similaritySearch(state.question)
			return { context: retrievedDocs };
		};


		// const generate = async (state: typeof StateAnnotation.State) => {
		// 	const docsContent = state.context.map(doc => doc.pageContent).join("\n");
		// 	const messages = await promptTemplate.invoke({ question: state.question, context: docsContent });
		// 	const response = await llm.invoke(messages);
		// 	return { answer: response.content };
		// };

		const generate = async (state: typeof StateAnnotation.State) => {
			const docsContent = state.context.map(doc => doc.pageContent).join("\n");
			const messages = await promptTemplate.invoke({ 
					question: state.question, 
					context: docsContent 
			});
			const response = await llm.invoke(messages);
			return { answer: response.content };
	};
	


		// Compile application and test
		const graph = new StateGraph(StateAnnotation)
			.addNode("retrieve", retrieve)
			.addNode("generate", generate)
			.addEdge("__start__", "retrieve")
			.addEdge("retrieve", "generate")
			.addEdge("generate", "__end__")
			.compile();

		let inputs = { question: "What is this book about" };

		const result = await graph.invoke(inputs);
		console.log('answer:', result.answer);

		db.updateBook({
			title: fileName,
			vectorDBCollectionMappping: '',
			indexingStatus: 'indexed'
		});

		return {
			success: true,
			message: 'Indexing successful',
			graph: graph
		};
	} catch (error) {
		console.error('Error loading PDF:', error);
		return { success: false, message: error.toString() };
	}

};


/**
 * [Function to load the vector store and the graph]
 * @param fileName 
 * @returns 
 */
export const loadVectorStoreAndGraph = async (fileName: string) => {

	try {

		// Prompt template
		// const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

		const promptTemplate = ChatPromptTemplate.fromTemplate(`
			You are an advanced AI assistant designed for question-answering tasks. Use the retrieved context to provide a detailed and well-structured response.
			
			If the retrieved context does not fully answer the question, acknowledge that and provide the best possible explanation based on available knowledge.
			
			### Question:  
			{question}  
			
			### Context:  
			{context}  
			
			### Answer:  
			- **Summary:** Provide a brief summary if applicable.  
			- **Key Details:** Elaborate on important points from the context.  
			- **Additional Insights:** Offer relevant background information if needed.  
			- **Sources:** Mention which parts of the context contributed to your response.  
			`);
			

		// embeddings
		console.log('api_key:', api_key);
		const embeddings = new OpenAIEmbeddings({
			model: "text-embedding-3-large",
			apiKey: api_key
		});

		// LLM
		const llm = new ChatOpenAI({
			model: "gpt-4o-mini",
			temperature: 0,
			apiKey: api_key
		});


		// load vector store from file
		const vectorDbDir = path.join(app.getPath('userData'), 'vectordb');
		// console.log({vectorDbDir})
		const vectorStore = await FaissStore.load(`${vectorDbDir}/${fileName}`, embeddings);

		// console.log('vectorStore:', vectorStore);

		// creating state graph
		const InputStateAnnotation = Annotation.Root({
			question: Annotation<string>,
		});

		const StateAnnotation = Annotation.Root({
			question: Annotation<string>,
			context: Annotation<Document[]>,
			answer: Annotation<string>,
		});

		// Define application steps
		const retrieve = async (state: typeof InputStateAnnotation.State) => {
			const retrievedDocs = await vectorStore.similaritySearch(state.question)
			return { context: retrievedDocs };
		};


		// const generate = async (state: typeof StateAnnotation.State) => {
		// 	const docsContent = state.context.map(doc => doc.pageContent).join("\n");
		// 	const messages = await promptTemplate.invoke({ question: state.question, context: docsContent });
		// 	const response = await llm.invoke(messages);
		// 	return { answer: response.content };
		// };

		const generate = async (state: typeof StateAnnotation.State) => {
			const docsContent = state.context.map(doc => doc.pageContent).join("\n");
			const messages = await promptTemplate.invoke({ 
					question: state.question, 
					context: docsContent 
			});
			const response = await llm.invoke(messages);
			return { answer: response.content };
	};
	

		// Compile application and test
		const graph = new StateGraph(StateAnnotation)
			.addNode("retrieve", retrieve)
			.addNode("generate", generate)
			.addEdge("__start__", "retrieve")
			.addEdge("retrieve", "generate")
			.addEdge("generate", "__end__")
			.compile();

		// test the graph
		const testInput = { question: "What is this book or article about?" };
		const testOutput = await graph.invoke(testInput);
		console.log('testOutput:', testOutput);

		return {
			success: true,
			graph: graph
		};
	} catch (error) {
		log.error(error);
	}
}
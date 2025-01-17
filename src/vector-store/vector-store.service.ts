import { Injectable } from '@nestjs/common';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { pull } from 'langchain/hub';
import { Readable } from 'stream';
import { AudioService } from '../audio/audio.service';
import { STOP_COMMANDS, GREETINGS, APPRECIATION_RESPONSES } from '../config/responses.config';
import { AI_CONFIG } from '../config/ai.config';

dotenv.config();

@Injectable()
export class VectorStoreService {
  private cache = new Map<string, any>();
  private allChunks: string = '';
  private embeddings: OpenAIEmbeddings;
  private pinecone: Pinecone;
  private vectorStore: PineconeStore;

  constructor(private readonly audioService: AudioService) {
    // Initialize embeddings and Pinecone index once during service initialization
    this.embeddings = new OpenAIEmbeddings(AI_CONFIG.embedding);

    this.pinecone = new Pinecone();

    const pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX!);

    // Await the initialization of PineconeStore
    PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    }).then(store => {
      this.vectorStore = store;
    }).catch(error => {
      console.error('Error initializing PineconeStore:', error);
    });
  }

  private async sendTextWithAudio(text: string, onData: (chunk: any, isAudio?: boolean) => void) {
    // Start generating audio first
    const audioPromise = this.audioService.streamTextToSpeech(text);
    
    // Add a small delay before showing text (300ms)
    await new Promise(resolve => setTimeout(resolve, 1500));
    onData(text);

    try {
      const audioStream = await audioPromise;
      audioStream.on('data', (chunk) => {
        onData(chunk, true);
      });
      await new Promise((resolve) => {
        audioStream.on('end', resolve);
      });
    } catch (error) {
      console.error('Error generating audio for quick reply:', error);
    }
  }

  async pushEmbeddingsToPinecone(docs: any[]) {
    const docsWithoutMetadata = docs.map(doc => {
      const { metadata, ...rest } = doc;
      return rest;
    });
    await this.vectorStore.addDocuments(docsWithoutMetadata);
  }

  async retrieveDataFromPinecone(query: string, onData: (chunk: any, isAudio?: boolean) => void) {
    const cleanQuery = query.toLowerCase().trim();

    // Check for stop commands
    if (STOP_COMMANDS.includes(cleanQuery)) {
      await this.sendTextWithAudio('Ok', onData);
      return 'Ok';
    }

    // Check for greetings
    if (GREETINGS.has(cleanQuery)) {
      const response = GREETINGS.get(cleanQuery);
      await this.sendTextWithAudio(response, onData);
      return response;
    }

    // Check for appreciation/thanks
    if (APPRECIATION_RESPONSES.has(cleanQuery)) {
      const response = APPRECIATION_RESPONSES.get(cleanQuery);
      await this.sendTextWithAudio(response, onData);
      return response;
    }

    // Reset allChunks at the start of each request
    this.allChunks = '';
    const startTime = Date.now();

    if (this.cache.has(query)) {
      return this.cache.get(query);
    }

    console.log(`Setup time: ${Date.now() - startTime}ms - Setup embeddings and Pinecone index`);

    const retrievalStartTime = Date.now();
    const retriever = this.vectorStore.asRetriever(AI_CONFIG.retriever);

    let prompt: ChatPromptTemplate;
    try {
      prompt = await pull<ChatPromptTemplate>('rlm/rag-prompt');
    } catch (error) {
      console.error('Error fetching prompt template:', error);
      throw new Error('Failed to fetch prompt template');
    }

    const llm = new ChatOpenAI(AI_CONFIG.chat);

    const ragChain = await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
    });

    const retrievedDocs = await retriever.invoke(query);
   

    console.log(`Retrieval time: ${Date.now() - retrievalStartTime}ms - Retrieve documents based on the query`);

    const processingStartTime = Date.now();
    const stream = await ragChain.stream({
      question: query,
      context: retrievedDocs,
    });

    const readable = new Readable({
      read() {
        // no-op
      }
    });

    for await (const chunk of stream) {
      onData(chunk);
      this.allChunks += chunk;
      readable.push(chunk);
    }

    readable.push(null);

    const answer = await new Promise((resolve, reject) => {
      let data = '';
      readable.on('data', (chunk) => {
        data += chunk;
      });
      readable.on('end', () => {
        resolve(data);
      });
      readable.on('error', (err) => {
        reject(err);
      });
    });

    console.log(`Processing time: ${Date.now() - processingStartTime}ms - Process and accumulate data chunks`);

    // Generate and stream audio after all text is received
    if (this.allChunks) {
      try {
        const audioStream = await this.audioService.streamTextToSpeech(this.allChunks);
        audioStream.on('data', (chunk) => {
          onData(chunk, true);
        });
        
        await new Promise((resolve) => {
          audioStream.on('end', resolve);
        });
      } catch (error) {
        console.error('Error generating audio:', error);
      }
    }

    
  
    return answer;
  }

  
}

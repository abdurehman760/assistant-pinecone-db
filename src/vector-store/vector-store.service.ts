import { Injectable } from '@nestjs/common';
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class VectorStoreService {
  private cache = new Map<string, any>();

  async pushEmbeddingsToPinecone(docs: any[]) {
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
    });

    const pinecone = new Pinecone();

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      maxConcurrency: 5, 
    });

    await vectorStore.addDocuments(docs);
  }

  async retrieveDataFromPinecone(query: string) {
    if (this.cache.has(query)) {
      return this.cache.get(query);
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
    });

    const pinecone = new Pinecone();

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      maxConcurrency: 5, 
    });

    const vectorStoreRetriever = vectorStore.asRetriever({ k: 3 });
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    });

    const chain = RetrievalQAChain.fromLLM(model, vectorStoreRetriever);

    const answer = await chain.call({
      query: query
    });

    this.cache.set(query, answer);
    return answer;
  }
}

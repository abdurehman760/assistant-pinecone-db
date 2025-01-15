## Plan to Build a Code in NestJS using LangChain with Pinecone as Vector DB

1. **Setup Environment:**
   - Install necessary packages:
     ```bash
     npm install @nestjs/core @nestjs/common @nestjs/cli langchain dotenv @langchain/community @langchain/core pdf-parse @langchain/openai @langchain/pinecone @pinecone-database/pinecone
     ```
   - Create a `.env` file to store your API keys and other environment variables:
     ```
     OPENAI_API_KEY=your-api-key
     PINECONE_API_KEY=your-pinecone-api-key
     PINECONE_INDEX=your-pinecone-index
     PINECONE_ENVIRONMENT=your-pinecone-environment
     PDF_PATH=E:/Texagon/new_assistant/src/documents/budget_speech.pdf
     ```
     - You can find the `PINECONE_ENVIRONMENT` in your Pinecone dashboard under the "API Keys" section.

2. **Project Structure:**
   - Organize your project files as follows:
     ```
     project-root/
     ├── src/
     │   ├── documents/
     │   │   └── budget_speech.pdf
     │   ├── langchain/
     │   │   ├── langchain.module.ts
     │   │   ├── langchain.service.ts
     │   │   └── langchain.controller.ts
     │   ├── pdf-loader/
     │   │   ├── pdf-loader.module.ts
     │   │   ├── pdf-loader.service.ts
     │   ├── pinecone-client/
     │   │   ├── pinecone-client.module.ts
     │   │   ├── pinecone-client.service.ts
     │   ├── vector-store/
     │   │   ├── vector-store.module.ts
     │   │   ├── vector-store.service.ts
     │   ├── app.module.ts
     ├── .env
     ├── package.json
     ├── nest-cli.json
     ├── config.ts
     ├── utils.ts
     └── README.md
     ```

3. **Create LangChain Module:**
   - Use Nest CLI to generate the LangChain module, service, and controller.
   - Open VS Code terminal and run the following commands:
     ```bash
     nest generate module langchain
     nest generate service langchain
     nest generate controller langchain
     ```

4. **Create PDF Loader Module:**
   - Use Nest CLI to generate the PDF Loader module and service.
   - Open VS Code terminal and run the following commands:
     ```bash
     nest generate module pdf-loader
     nest generate service pdf-loader
     ```

   - **Purpose:** Load PDF documents and split them into chunks.
   - Example:
     ```typescript
     // src/pdf-loader/pdf-loader.module.ts
     import { Module } from '@nestjs/common';
     import { PdfLoaderService } from './pdf-loader.service';

     @Module({
       providers: [PdfLoaderService],
       exports: [PdfLoaderService],
     })
     export class PdfLoaderModule {}
     ```

     ```typescript
     // src/pdf-loader/pdf-loader.service.ts
     import { Injectable } from '@nestjs/common';
     import { PDFLoader } from "langchain/document_loaders/fs/pdf";
     import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
     import { env } from "../config";

     @Injectable()
     export class PdfLoaderService {
       async getChunkedDocsFromPDF() {
         try {
           const loader = new PDFLoader(env.PDF_PATH);
           const docs = await loader.load();

           const textSplitter = new RecursiveCharacterTextSplitter({
             chunkSize: 1000,
             chunkOverlap: 200,
           });

           const chunkedDocs = await textSplitter.splitDocuments(docs);

           return chunkedDocs;
         } catch (e) {
           console.error(e);
           throw new Error("PDF docs chunking failed !");
         }
       }
     }
     ```

5. **Create Pinecone Client Module:**
   - Use Nest CLI to generate the Pinecone Client module and service.
   - Open VS Code terminal and run the following commands:
     ```bash
     nest generate module pinecone-client
     nest generate service pinecone-client
     ```

   - **Purpose:** Initialize and manage the Pinecone client.
   - Example:
     ```typescript
     // src/pinecone-client/pinecone-client.module.ts
     import { Module } from '@nestjs/common';
     import { PineconeClientService } from './pinecone-client.service';

     @Module({
       providers: [PineconeClientService],
       exports: [PineconeClientService],
     })
     export class PineconeClientModule {}
     ```

     ```typescript
     // src/pinecone-client/pinecone-client.service.ts
     import { Injectable } from '@nestjs/common';
     import { PineconeClient } from "@pinecone-database/pinecone";
     import { env } from "../config";
     import { delay } from "../utils";

     let pineconeClientInstance: PineconeClient | null = null;

     @Injectable()
     export class PineconeClientService {
       async createIndex(client: PineconeClient, indexName: string) {
         try {
           await client.createIndex({
             createRequest: {
               name: indexName,
               dimension: 1536,
               metric: "cosine",
             },
           });
           console.log(
             `Waiting for ${env.INDEX_INIT_TIMEOUT} seconds for index initialization to complete...`
           );
           await delay(env.INDEX_INIT_TIMEOUT);
           console.log("Index created !!");
         } catch (error) {
           console.error("error ", error);
           throw new Error("Index creation failed");
         }
       }

       async initPineconeClient() {
         try {
           const pineconeClient = new PineconeClient();
           await pineconeClient.init({
             apiKey: env.PINECONE_API_KEY,
             environment: env.PINECONE_ENVIRONMENT,
           });
           const indexName = env.PINECONE_INDEX_NAME;

           const existingIndexes = await pineconeClient.listIndexes();

           if (!existingIndexes.includes(indexName)) {
             await this.createIndex(pineconeClient, indexName);
           } else {
             console.log("Your index already exists. nice !!");
           }

           return pineconeClient;
         } catch (error) {
           console.error("error", error);
           throw new Error("Failed to initialize Pinecone Client");
         }
       }

       async getPineconeClient() {
         if (!pineconeClientInstance) {
           pineconeClientInstance = await this.initPineconeClient();
         }

         return pineconeClientInstance;
       }
     }
     ```

     ```typescript
     // src/utils.ts
     export function delay(ms: number) {
       return new Promise(resolve => setTimeout(resolve, ms));
     }
     ```

     ```typescript
     // src/config.ts
     export const env = {
       PDF_PATH: process.env.PDF_PATH,
       PINECONE_API_KEY: process.env.PINECONE_API_KEY,
       PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
       PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
       INDEX_INIT_TIMEOUT: parseInt(process.env.INDEX_INIT_TIMEOUT, 10) || 60,
     };
     ```

6. **Create Vector Store Module:**
   - Use Nest CLI to generate the Vector Store module and service.
   - Open VS Code terminal and run the following commands:
     ```bash
     nest generate module vector-store
     nest generate service vector-store
     ```

   - **Purpose:** Manage the vector store using Pinecone.
   - Example:
     ```typescript
     // src/vector-store/vector-store.module.ts
     import { Module } from '@nestjs/common';
     import { VectorStoreService } from './vector-store.service';

     @Module({
       providers: [VectorStoreService],
       exports: [VectorStoreService],
     })
     export class VectorStoreModule {}
     ```

     ```typescript
     // src/vector-store/vector-store.service.ts
     import { Injectable } from '@nestjs/common';
     import { PineconeClient } from "@pinecone-database/pinecone";
     import { env } from "../config";
     import { delay } from "../utils";

     let pineconeClientInstance: PineconeClient | null = null;

     @Injectable()
     export class VectorStoreService {
       async createIndex(client: PineconeClient, indexName: string) {
         try {
           await client.createIndex({
             createRequest: {
               name: indexName,
               dimension: 1536,
               metric: "cosine",
             },
           });
           console.log(
             `Waiting for ${env.INDEX_INIT_TIMEOUT} seconds for index initialization to complete...`
           );
           await delay(env.INDEX_INIT_TIMEOUT);
           console.log("Index created !!");
         } catch (error) {
           console.error("error ", error);
           throw new Error("Index creation failed");
         }
       }

       async initPineconeClient() {
         try {
           const pineconeClient = new PineconeClient();
           await pineconeClient.init({
             apiKey: env.PINECONE_API_KEY,
             environment: env.PINECONE_ENVIRONMENT,
           });
           const indexName = env.PINECONE_INDEX_NAME;

           const existingIndexes = await pineconeClient.listIndexes();

           if (!existingIndexes.includes(indexName)) {
             await this.createIndex(pineconeClient, indexName);
           } else {
             console.log("Your index already exists. nice !!");
           }

           return pineconeClient;
         } catch (error) {
           console.error("error", error);
           throw new Error("Failed to initialize Pinecone Client");
         }
       }

       async getPineconeClient() {
         if (!pineconeClientInstance) {
           pineconeClientInstance = await this.initPineconeClient();
         }

         return pineconeClientInstance;
       }
     }
     ```
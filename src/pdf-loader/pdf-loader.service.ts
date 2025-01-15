import { Injectable } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { VectorStoreService } from '../vector-store/vector-store.service';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PdfLoaderService {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async getChunkedDocsFromPDF() {
    try {
      const loader = new PDFLoader(process.env.PDF_PATH);
      const docs = await loader.load();

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 20,
        separators: ["\n\n", "\n", " ", ""], // Defines splitting hierarchy
      });

      const chunkedDocs = await textSplitter.splitDocuments(docs);

      return chunkedDocs;
    } catch (e) {
      console.error(e);
      throw new Error("PDF docs chunking failed !");
    }
  }

  async loadAndStorePDF() {
    const chunkedDocs = await this.getChunkedDocsFromPDF();
    await this.vectorStoreService.pushEmbeddingsToPinecone(chunkedDocs);
  }
}

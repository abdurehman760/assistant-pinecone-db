import { Injectable } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { VectorStoreService } from '../vector-store/vector-store.service';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PdfLoaderService {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async getChunkedDocsFromPDF(filePath: string) {
    try {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 20,
        separators: ["\n\n", "\n", " ", ""], // Defines splitting hierarchy
      });

      const chunkedDocs = await textSplitter.splitDocuments(docs);

      // Remove metadata from chunked documents
      const chunkedDocsWithoutMetadata = chunkedDocs.map(doc => ({
        pageContent: doc.pageContent,
      }));

      console.log(chunkedDocsWithoutMetadata);

      return chunkedDocsWithoutMetadata;
    } catch (e) {
      console.error(e);
      throw new Error("PDF docs chunking failed !");
    }
  }

  async loadAndStorePDF(filePath?: string) {
    const path = filePath || process.env.PDF_PATH;
    const chunkedDocs = await this.getChunkedDocsFromPDF(path);
    await this.vectorStoreService.pushEmbeddingsToPinecone(chunkedDocs);
  }
}

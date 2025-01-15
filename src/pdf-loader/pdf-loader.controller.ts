import { Controller, Get, Query } from '@nestjs/common';
import { PdfLoaderService } from './pdf-loader.service';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Controller('pdf-loader')
export class PdfLoaderController {
  constructor(
    private readonly pdfLoaderService: PdfLoaderService,
    private readonly vectorStoreService: VectorStoreService
  ) {}

  @Get('load-pdf')
  async loadPdf() {
    const chunkedDocs = await this.pdfLoaderService.getChunkedDocsFromPDF();
    console.log(chunkedDocs);
    return chunkedDocs;
  }

  @Get('load-and-store-pdf')
  async loadAndStorePdf() {
    await this.pdfLoaderService.loadAndStorePDF();
    return { message: 'PDF loaded and stored in Pinecone successfully' };
  }

  @Get('retrieve-data')
  async retrieveData(@Query('query') query: string) {
    const answer = await this.vectorStoreService.retrieveDataFromPinecone(query);
    return { question: query, answer };
  }
}

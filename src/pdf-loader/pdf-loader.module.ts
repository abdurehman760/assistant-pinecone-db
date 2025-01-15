import { Module } from '@nestjs/common';
import { PdfLoaderService } from './pdf-loader.service';
import { PdfLoaderController } from './pdf-loader.controller';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [VectorStoreModule],
  providers: [PdfLoaderService],
  controllers: [PdfLoaderController],
  exports: [PdfLoaderService],
})
export class PdfLoaderModule {}

import { Module } from '@nestjs/common';

import { PdfLoaderModule } from './pdf-loader/pdf-loader.module';


@Module({
  imports: [PdfLoaderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

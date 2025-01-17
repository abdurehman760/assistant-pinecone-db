import { Module } from '@nestjs/common';
import { PdfLoaderModule } from './pdf-loader/pdf-loader.module';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { AudioModule } from './audio/audio.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PdfLoaderModule,
    VectorStoreModule,
    AudioModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

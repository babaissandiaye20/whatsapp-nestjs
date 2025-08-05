import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WhatsApp NestJS API')
    .setDescription('API pour envoyer des messages WhatsApp avec logs et statistiques')
    .setVersion('1.0.0')
    .addTag('whatsapp', 'Endpoints WhatsApp')
    .addTag('logs', 'Logs et statistiques')
    .addTag('health', 'Santé de l\'API')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'WhatsApp API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  // Start server on port 4500
  await app.listen(4500);
  console.log('🚀 WhatsApp API running on http://localhost:4500');
  console.log('📚 Swagger docs available at http://localhost:4500/api-docs');
}
bootstrap();
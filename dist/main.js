"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('WhatsApp NestJS API')
        .setDescription('API pour envoyer des messages WhatsApp avec logs et statistiques')
        .setVersion('1.0.0')
        .addTag('whatsapp', 'Endpoints WhatsApp')
        .addTag('logs', 'Logs et statistiques')
        .addTag('health', 'Santé de l\'API')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document, {
        customSiteTitle: 'WhatsApp API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
    });
    await app.listen(4500);
    console.log('🚀 WhatsApp API running on http://localhost:4500');
    console.log('📚 Swagger docs available at http://localhost:4500/api-docs');
}
bootstrap();
//# sourceMappingURL=main.js.map
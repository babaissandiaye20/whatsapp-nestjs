"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const whatsapp_service_1 = require("./whatsapp.service");
const send_message_dto_1 = require("./dto/send-message.dto");
let WhatsappController = class WhatsappController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    async sendMessage(body) {
        const { from, to, message } = body;
        if (!from || !to || !message) {
            throw new common_1.HttpException('Les champs from, to et message sont requis', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.whatsappService.sendMessage(from, to, message);
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getMessageLogs(numero) {
        return this.whatsappService.getMessageLogs(numero);
    }
    getAllMessageLogs() {
        return this.whatsappService.getMessageLogs();
    }
    getQRCode() {
        return this.whatsappService.getQRCode();
    }
    getStatus() {
        return this.whatsappService.getStatus();
    }
    async resetWhatsApp() {
        return await this.whatsappService.resetWhatsApp();
    }
    health() {
        return {
            status: 'OK',
            timestamp: new Date(),
            service: 'WhatsApp NestJS API',
            port: 4500,
        };
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)('send'),
    (0, swagger_1.ApiOperation)({
        summary: 'Envoyer un message WhatsApp',
        description: 'Envoie un message WhatsApp de manière dynamique avec logging automatique'
    }),
    (0, swagger_1.ApiBody)({
        description: 'Données pour envoyer un message',
        examples: {
            example1: {
                summary: 'Message de validation',
                value: {
                    from: '33123456789',
                    to: '33987654321',
                    message: 'Votre code de validation est: 123456'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message envoyé avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données manquantes ou invalides' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erreur lors de l\'envoi du message' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('logs/:numero'),
    (0, swagger_1.ApiTags)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir les logs d\'un numéro spécifique' }),
    (0, swagger_1.ApiParam)({ name: 'numero', description: 'Numéro de téléphone', example: '33123456789' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logs du numéro récupérés' }),
    __param(0, (0, common_1.Param)('numero')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getMessageLogs", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiTags)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir tous les logs de messages' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tous les logs récupérés' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getAllMessageLogs", null);
__decorate([
    (0, common_1.Get)('qr'),
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir le QR code pour connexion WhatsApp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'QR code généré' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getQRCode", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, swagger_1.ApiOperation)({ summary: 'Statut de la connexion WhatsApp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut de connexion et statistiques' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('reset'),
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, swagger_1.ApiOperation)({ summary: 'Redémarrer le client WhatsApp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client WhatsApp redémarré avec succès' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "resetWhatsApp", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiTags)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Vérification de la santé de l\'API' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API fonctionnelle' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "health", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map
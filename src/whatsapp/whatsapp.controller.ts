import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  @ApiOperation({ 
    summary: 'Envoyer un message WhatsApp',
    description: 'Envoie un message WhatsApp de manière dynamique avec logging automatique'
  })
  @ApiBody({
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
  })
  @ApiResponse({ status: 200, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 400, description: 'Données manquantes ou invalides' })
  @ApiResponse({ status: 500, description: 'Erreur lors de l\'envoi du message' })
  async sendMessage(@Body() body: SendMessageDto) {
    const { from, to, message } = body;

    if (!from || !to || !message) {
      throw new HttpException(
        'Les champs from, to et message sont requis',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.whatsappService.sendMessage(from, to, message);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('logs/:numero')
  @ApiTags('logs')
  @ApiOperation({ summary: 'Obtenir les logs d\'un numéro spécifique' })
  @ApiParam({ name: 'numero', description: 'Numéro de téléphone', example: '33123456789' })
  @ApiResponse({ status: 200, description: 'Logs du numéro récupérés' })
  getMessageLogs(@Param('numero') numero: string) {
    return this.whatsappService.getMessageLogs(numero);
  }

  @Get('logs')
  @ApiTags('logs')
  @ApiOperation({ summary: 'Obtenir tous les logs de messages' })
  @ApiResponse({ status: 200, description: 'Tous les logs récupérés' })
  getAllMessageLogs() {
    return this.whatsappService.getMessageLogs();
  }

  @Get('qr')
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Obtenir le QR code pour connexion WhatsApp' })
  @ApiResponse({ status: 200, description: 'QR code généré' })
  getQRCode() {
    return this.whatsappService.getQRCode();
  }

  @Get('qr-image')
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Obtenir l\'image QR code pour connexion WhatsApp' })
  @ApiResponse({ status: 200, description: 'Image QR code générée (PNG)' })
  @ApiResponse({ status: 404, description: 'Aucun QR code disponible' })
  async getQRCodeImage(@Res() res: Response) {
    const qrBuffer = await this.whatsappService.getQRCodeImage();
    
    if (!qrBuffer) {
      throw new HttpException(
        'Aucun QR code disponible. Le client WhatsApp n\'est pas initialisé.',
        HttpStatus.NOT_FOUND,
      );
    }

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': qrBuffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(qrBuffer);
  }

  @Get('status')
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Statut de la connexion WhatsApp' })
  @ApiResponse({ status: 200, description: 'Statut de connexion et statistiques' })
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('reset')
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Redémarrer le client WhatsApp' })
  @ApiResponse({ status: 200, description: 'Client WhatsApp redémarré avec succès' })
  async resetWhatsApp() {
    return await this.whatsappService.resetWhatsApp();
  }

  @Get('health')
  @ApiTags('health')
  @ApiOperation({ summary: 'Vérification de la santé de l\'API' })
  @ApiResponse({ status: 200, description: 'API fonctionnelle' })
  health() {
    return {
      status: 'OK',
      timestamp: new Date(),
      service: 'WhatsApp NestJS API',
      port: 4500,
    };
  }
}
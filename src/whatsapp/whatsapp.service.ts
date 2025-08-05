import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

export interface MessageLog {
  numero: string;
  count: number;
  messages: Array<{
    to: string;
    message: string;
    timestamp: Date;
    status: 'sent' | 'failed';
  }>;
}

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client;
  private isReady = false;
  private currentQR = '';
  private messageLogs: Map<string, MessageLog> = new Map();

  async onModuleInit() {
    this.client = new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
      },
    });

    this.client.on('qr', (qr) => {
      this.currentQR = qr;
      console.log('📱 QR Code généré! Scannez avec WhatsApp');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.isReady = true;
      console.log('✅ WhatsApp Client prêt!');
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Client déconnecté:', reason);
      this.isReady = false;
    });

    await this.client.initialize();
  }

  async sendMessage(from: string, to: string, message: string) {
    if (!this.isReady) {
      throw new Error('WhatsApp client not ready. Scan QR code first.');
    }

    try {
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      await this.client.sendMessage(chatId, message);

      // Log the message
      this.logMessage(from, to, message, 'sent');

      return {
        success: true,
        message: 'Message envoyé avec succès',
        from,
        to,
        content: message,
        timestamp: new Date(),
      };
    } catch (error) {
      // Log failed message
      this.logMessage(from, to, message, 'failed');

      return {
        success: false,
        message: 'Erreur lors de l\'envoi',
        error: error.message,
        from,
        to,
        content: message,
        timestamp: new Date(),
      };
    }
  }

  private logMessage(from: string, to: string, message: string, status: 'sent' | 'failed') {
    const key = from;
    
    if (!this.messageLogs.has(key)) {
      this.messageLogs.set(key, {
        numero: from,
        count: 0,
        messages: [],
      });
    }

    const log = this.messageLogs.get(key);
    if (status === 'sent') {
      log.count++;
    }
    
    log.messages.push({
      to,
      message,
      timestamp: new Date(),
      status,
    });

    // Keep only last 100 messages per number
    if (log.messages.length > 100) {
      log.messages = log.messages.slice(-100);
    }
  }

  getMessageLogs(numero?: string) {
    if (numero) {
      return this.messageLogs.get(numero) || {
        numero,
        count: 0,
        messages: [],
      };
    }

    return Array.from(this.messageLogs.values());
  }

  getQRCode() {
    return {
      qr: this.currentQR,
      isReady: this.isReady,
    };
  }

  getStatus() {
    return {
      isReady: this.isReady,
      totalNumbers: this.messageLogs.size,
      totalMessages: Array.from(this.messageLogs.values()).reduce(
        (total, log) => total + log.count,
        0,
      ),
    };
  }
}
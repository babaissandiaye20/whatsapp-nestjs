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
      authStrategy: new (await import('whatsapp-web.js')).LocalAuth({
        clientId: 'whatsapp-client',
      }),
      puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-default-apps',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
      },
    });

    this.client.on('qr', (qr) => {
      this.currentQR = qr;
      console.log('📱 QR Code généré! URL:', qr);
      console.log('📱 QR Code length:', qr.length);
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.isReady = true;
      console.log('✅ WhatsApp Client prêt!');
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Client déconnecté:', reason);
      this.isReady = false;
      this.currentQR = '';
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Échec d\'authentification:', msg);
      this.currentQR = '';
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

  async resetWhatsApp() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
      this.isReady = false;
      this.currentQR = '';
      
      // Reinitialize client
      await this.onModuleInit();
      
      return { success: true, message: 'WhatsApp client reset successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to reset WhatsApp client', error: error.message };
    }
  }
}
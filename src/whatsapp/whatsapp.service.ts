import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';

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
  private keepAliveInterval: NodeJS.Timeout;

  async onModuleInit() {
    this.client = new Client({
      authStrategy: new (await import('whatsapp-web.js')).LocalAuth({
        clientId: `whatsapp-${Date.now()}`,
        dataPath: './.wwebjs_auth'
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
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        timeout: 0,
        handleSIGTERM: false,
        handleSIGINT: false,
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
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
      
      // Démarrer le keep-alive
      this.startKeepAlive();
    });

    this.client.on('authenticated', () => {
      console.log('✅ Client authentifié avec succès!');
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`🔄 Chargement: ${percent}% - ${message}`);
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Client déconnecté:', reason);
      console.log('❌ Raison détaillée:', JSON.stringify(reason));
      this.isReady = false;
      this.currentQR = '';
      
      // Arrêter le keep-alive
      this.stopKeepAlive();
      
      // Tentative de reconnexion après déconnexion
      setTimeout(() => {
        console.log('🔄 Tentative de reconnexion...');
        this.onModuleInit().catch(err => {
          console.error('❌ Erreur reconnexion:', err);
        });
      }, 10000);
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

  async getQRCodeImage(): Promise<Buffer | null> {
    if (!this.currentQR) {
      return null;
    }

    try {
      // Générer l'image QR code en PNG avec haute qualité
      const qrBuffer = await QRCode.toBuffer(this.currentQR, {
        type: 'png',
        width: 512,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrBuffer;
    } catch (error) {
      console.error('Erreur génération QR image:', error);
      return null;
    }
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

  private startKeepAlive() {
    console.log('🔄 Démarrage du keep-alive...');
    
    // Keep-alive toutes les 30 secondes
    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.isReady && this.client) {
          // Ping silencieux pour maintenir la connexion
          const info = await this.client.info;
          console.log('💓 Keep-alive ping réussi', new Date().toISOString());
        }
      } catch (error) {
        console.error('❌ Erreur keep-alive:', error.message);
      }
    }, 30000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      console.log('🛑 Keep-alive arrêté');
    }
  }

  async resetWhatsApp() {
    try {
      this.stopKeepAlive();
      
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
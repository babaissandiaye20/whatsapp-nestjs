import { Injectable, OnModuleInit } from '@nestjs/common';
import makeWASocket, { 
  ConnectionState, 
  WASocket, 
  AuthenticationState,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import P from 'pino';

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
  private sock: WASocket;
  private isReady = false;
  private currentQR = '';
  private messageLogs: Map<string, MessageLog> = new Map();
  private keepAliveInterval: NodeJS.Timeout;
  private businessNumber = '221786360662'; // Numéro WhatsApp Business fixe
  private logger = P({ level: 'info' });
  
  constructor() {
    this.ensureSessionDirectory();
  }

  private ensureSessionDirectory() {
    const sessionPath = path.join(process.cwd(), 'auth_info_baileys');
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
      console.log('📁 Dossier de sessions Baileys créé:', sessionPath);
    }
  }

  async onModuleInit() {
    try {
      await this.initializeWhatsApp();
    } catch (error) {
      console.error('❌ Erreur initialisation WhatsApp:', error);
      // Retry après 10 secondes
      setTimeout(() => this.onModuleInit(), 10000);
    }
  }

  private async initializeWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`📱 Version Baileys: ${version.join('.')}, Latest: ${isLatest}`);
    console.log(`📱 Numéro Business configuré: +${this.businessNumber}`);

    this.sock = makeWASocket({
      version,
      logger: this.logger,
      printQRInTerminal: false,
      auth: state,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    // Événements de connexion
    this.sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        this.currentQR = qr;
        console.log('📱 QR Code généré pour +221786360662');
        console.log('📱 Scannez ce QR avec WhatsApp Business sur le téléphone:', this.businessNumber);
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = 
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('❌ Connexion fermée. Reconnexion:', shouldReconnect);
        
        if (shouldReconnect) {
          setTimeout(() => this.initializeWhatsApp(), 5000);
        } else {
          this.isReady = false;
          this.currentQR = '';
        }
      } else if (connection === 'open') {
        this.isReady = true;
        this.currentQR = '';
        console.log('✅ WhatsApp connecté avec succès!');
        console.log('📱 Numéro Business actif:', this.businessNumber);
        this.startKeepAlive();
      }
    });

    // Sauvegarder les credentials
    this.sock.ev.on('creds.update', saveCreds);

    // Événements de messages reçus
    this.sock.ev.on('messages.upsert', ({ messages }) => {
      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          console.log('📨 Message reçu de:', message.key.remoteJid);
        }
      }
    });
  }

  async sendMessage(from: string, to: string, message: string) {
    if (!this.isReady || !this.sock) {
      throw new Error(`WhatsApp Business ${this.businessNumber} not ready. Please scan QR code first.`);
    }

    try {
      // Formater le numéro de destination
      const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
      
      // Envoyer le message
      await this.sock.sendMessage(jid, { text: message });

      // Logger le message
      this.logMessage(from, to, message, 'sent');

      return {
        success: true,
        message: 'Message envoyé avec succès',
        from: this.businessNumber,
        to,
        content: message,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logMessage(from, to, message, 'failed');

      return {
        success: false,
        message: 'Erreur lors de l\'envoi',
        error: error.message,
        from: this.businessNumber,
        to,
        content: message,
        timestamp: new Date(),
      };
    }
  }

  private logMessage(from: string, to: string, message: string, status: 'sent' | 'failed') {
    const key = this.businessNumber; // Utiliser le numéro business comme clé
    
    if (!this.messageLogs.has(key)) {
      this.messageLogs.set(key, {
        numero: this.businessNumber,
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

    // Garder seulement les 100 derniers messages
    if (log.messages.length > 100) {
      log.messages = log.messages.slice(-100);
    }
  }

  getMessageLogs(numero?: string) {
    if (numero && numero !== this.businessNumber) {
      return {
        numero,
        count: 0,
        messages: [],
      };
    }

    return this.messageLogs.get(this.businessNumber) || {
      numero: this.businessNumber,
      count: 0,
      messages: [],
    };
  }

  getQRCode() {
    return {
      qr: this.currentQR,
      isReady: this.isReady,
      businessNumber: this.businessNumber,
    };
  }

  async getQRCodeImage(): Promise<Buffer | null> {
    if (!this.currentQR) {
      return null;
    }

    try {
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
      businessNumber: this.businessNumber,
      totalNumbers: 1, // Un seul numéro business
      totalMessages: this.messageLogs.get(this.businessNumber)?.count || 0,
    };
  }

  private startKeepAlive() {
    console.log('🔄 Démarrage du keep-alive pour', this.businessNumber);
    
    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.isReady && this.sock) {
          // Ping silencieux
          await this.sock.query({ tag: 'iq', attrs: { type: 'get', xmlns: 'w:ping' } });
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
      
      if (this.sock) {
        this.sock.ws.close();
      }
      
      this.isReady = false;
      this.currentQR = '';
      
      // Reinitialiser
      await this.initializeWhatsApp();
      
      return { 
        success: true, 
        message: `WhatsApp Business ${this.businessNumber} reset successfully` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to reset WhatsApp Business', 
        error: error.message 
      };
    }
  }
}
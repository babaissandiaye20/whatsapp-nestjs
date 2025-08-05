"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
let WhatsappService = class WhatsappService {
    constructor() {
        this.isReady = false;
        this.currentQR = '';
        this.messageLogs = new Map();
    }
    async onModuleInit() {
        this.client = new whatsapp_web_js_1.Client({
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
    async sendMessage(from, to, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp client not ready. Scan QR code first.');
        }
        try {
            const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
            await this.client.sendMessage(chatId, message);
            this.logMessage(from, to, message, 'sent');
            return {
                success: true,
                message: 'Message envoyé avec succès',
                from,
                to,
                content: message,
                timestamp: new Date(),
            };
        }
        catch (error) {
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
    logMessage(from, to, message, status) {
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
        if (log.messages.length > 100) {
            log.messages = log.messages.slice(-100);
        }
    }
    getMessageLogs(numero) {
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
            totalMessages: Array.from(this.messageLogs.values()).reduce((total, log) => total + log.count, 0),
        };
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map
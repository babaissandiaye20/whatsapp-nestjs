import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    sendMessage(body: SendMessageDto): Promise<{
        success: boolean;
        message: string;
        from: string;
        to: string;
        content: string;
        timestamp: Date;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        from: string;
        to: string;
        content: string;
        timestamp: Date;
    }>;
    getMessageLogs(numero: string): import("./whatsapp.service").MessageLog | import("./whatsapp.service").MessageLog[];
    getAllMessageLogs(): import("./whatsapp.service").MessageLog | import("./whatsapp.service").MessageLog[];
    getQRCode(): {
        qr: string;
        isReady: boolean;
    };
    getStatus(): {
        isReady: boolean;
        totalNumbers: number;
        totalMessages: number;
    };
    health(): {
        status: string;
        timestamp: Date;
        service: string;
        port: number;
    };
}

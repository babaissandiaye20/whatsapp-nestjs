import { OnModuleInit } from '@nestjs/common';
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
export declare class WhatsappService implements OnModuleInit {
    private client;
    private isReady;
    private currentQR;
    private messageLogs;
    onModuleInit(): Promise<void>;
    sendMessage(from: string, to: string, message: string): Promise<{
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
    private logMessage;
    getMessageLogs(numero?: string): MessageLog | MessageLog[];
    getQRCode(): {
        qr: string;
        isReady: boolean;
    };
    getStatus(): {
        isReady: boolean;
        totalNumbers: number;
        totalMessages: number;
    };
}

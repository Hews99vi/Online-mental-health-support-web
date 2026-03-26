export interface ChatUiMessage {
    id: string;
    senderId: string;
    plaintext: string;
    sentAt: string;
    status: 'sending' | 'delivered' | 'failed';
}

export class DIDCommMessage<TBody = any, TAttachment = any> {
    type: string;
    id: string;
    thid: string;
    from: string;
    to?: string[];
    body?: TBody;
    attachments?: TAttachment;
}
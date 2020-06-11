export interface SenderApi {
    send(...params: any[]): Promise<void>;
    verifyRoute(...params: any[]): Promise<void>
}

export interface RouteSenderAPI {
    send(...params: any[]): Promise<void>;
    verifyRoute(...params: any[]): Promise<void>
}

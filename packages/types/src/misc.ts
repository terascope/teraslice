export type MACDelimiter = 'space' | 'colon' | 'dash' | 'dot' | 'none' | 'any';

export interface MACAddress {
    delimiter: MACDelimiter | MACDelimiter[];
}

export interface SenderApi {
    send(...params: any[]): Promise<void>;
    verifyRoute(...params: any[]): Promise<void>
}

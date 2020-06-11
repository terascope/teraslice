export type MACDelimiter = 'space' | 'colon' | 'dash' | 'dot' | 'none' | 'any';

export interface MACAddress {
    delimiter: MACDelimiter | MACDelimiter[];
}

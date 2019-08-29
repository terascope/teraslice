// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SimpleAPIConfig {

}

export interface SimpleAPI {
    count: number;
    add(n?: number): void;
    sub(n?: number): void;
}

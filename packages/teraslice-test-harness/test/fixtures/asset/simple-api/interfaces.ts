export interface SimpleAPIConfig {

}

export interface SimpleAPI {
    count: number;
    add(n?: number): void;
    sub(n?: number): void;
}

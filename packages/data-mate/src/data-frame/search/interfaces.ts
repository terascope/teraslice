export interface MatchRowFn {
    (rowIndex: number): boolean;
}

export interface MatchValueFn {
    (value: unknown): boolean;
}

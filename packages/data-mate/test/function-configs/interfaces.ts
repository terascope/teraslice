export interface ColumnTests {
    column: any[];
    result: any[];
}

export interface RowsTests {
    rows: Record<string, unknown>[];
    result: (Record<string, unknown> | null)[];
}

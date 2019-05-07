export type QueryState = {
    from?: number,
    size?: number,
    query?: string,
    sort?: string
};

export type SortDirection = 'asc'|'desc';
export type ParsedSort = { field: string, direction: SortDirection };

export type ColumnMapping = {
    [field: string]: {
        label: string;
        format: (data: any) => any;
    }
};

export type RowMapping = {
    getId: (data: any) => string;
    columns: ColumnMapping;
};

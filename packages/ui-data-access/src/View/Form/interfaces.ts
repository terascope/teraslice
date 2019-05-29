export type Input = {
    id?: string;
    client_id: number | string;
    name: string;
    description: string;
    includes: string[];
    excludes: string[];
    constraint: string;
};

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name', 'excludes', 'includes', 'constraint'];

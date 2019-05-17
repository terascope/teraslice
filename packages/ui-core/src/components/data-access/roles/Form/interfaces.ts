export type Input = {
    id?: string;
    client_id: number | string;
    name: string;
    description: string;
};

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name'];

export type FieldOptions = {
    name: keyof Input;
    label: string;
    placeholder?: string;
};

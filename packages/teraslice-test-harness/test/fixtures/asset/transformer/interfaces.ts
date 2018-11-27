export interface TransformerConfig {
    action: Action;
    key: string;
    setValue: string;
    incBy: number;
}

export type Action = 'set' | 'drop' | 'inc';
export const actions: Action[] = ['set', 'drop', 'inc'];

export declare function bindThis(instance: object, cls: object): void;
export interface ast {
    right?: ast;
    left?: ast;
    field?: string;
    operator?: string;
    term?: string | number;
    inclusive_min?: string | number;
    inclusive_max?: string | number;
    term_min?: string | number;
    term_max?: string | number;
}

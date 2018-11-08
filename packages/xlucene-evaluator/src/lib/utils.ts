
export function bindThis(instance:object, cls:object): void {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        .filter((name) => {
            const method = instance[name];
            return method instanceof Function && method !== cls;
        })
        .forEach((mtd) => {
            instance[mtd] = instance[mtd].bind(instance);
        });
}

export interface ast {
    right?: ast;
    left?: ast;
    field?: string;
    operator?: string;
    term?: string|number;
    inclusive_min?: string|number;
    inclusive_max?: string|number;
    term_min?: string|number;
    term_max?: string|number;
    parens?: Boolean,
    regexpr?: Boolean
}

type AnyFn = (...args: any[]) => any;

/**
 * Curry one or more functions, where all must returned falsy values
*/
export function not<T extends AnyFn>(...fns: T[]): T {
    return function _not(...args) {
        return fns.every((fn) => !fn(...args));
    } as T;
}

/**
 * Curry one or more functions, where all must returned truthy values
*/
export function and<T extends AnyFn>(...fns: T[]): T {
    return function _and(...args) {
        return fns.every((fn) => fn(...args));
    } as T;
}

/**
 * Curry one or more functions, where one must returned a truthy value
*/
export function or<T extends AnyFn>(...fns: T[]): T {
    return function _or(...args) {
        return fns.some((fn) => fn(...args));
    } as T;
}

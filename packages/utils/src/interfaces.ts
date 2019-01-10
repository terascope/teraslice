/**
 * Omit the properties available to type.
 * Useful for excluding properties from a type
 *
 * @example `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`
*/
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Overwrite a simple type with different properties.
 * Useful for change the type of property or making one optional
 *
 * @example `Overwrite<{ a: number, b: number }, { b?: number }>`
*/
export type Overwrite<T1, T2> = {
    [P in Exclude<keyof T1, keyof T2>]: T1[P]
} & T2;

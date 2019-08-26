/**
 * Omit the properties available to type.
 * Useful for excluding properties from a type
 *
 * @example `Omit<{ a: number, b: number, c: number }, 'b'|'c'> // => { a: 1 }`
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Overwrite a simple type with different properties.
 * Useful changing and adding additional properties
 *
 * @example `Overwrite<{ a: number, b: number }, { b?: number }>`
 */
export type Overwrite<T1, T2> = { [P in Exclude<keyof T1, keyof T2>]: T1[P] } & T2;

/**
 * Override specific properties on a type
 *
 * @example `Override<{ a: number, b: number }, { b: string }>`
 */

export type Override<T1, T2 extends { [P in keyof T2]: P extends keyof T1 ? T2[P] : never }> = {
    [P in keyof T1]: P extends keyof T1 ? T2[P] : T1[P]
};

/**
 * Like Partial but makes certain properties required
 *
 * @example `Required<{ a: number, b: number }, 'b'>`
 */
export type Required<T, K extends keyof T> = { [P in keyof T]: P extends K ? NonNullable<T[P]> : (NonNullable<T[P]> | undefined) };

/**
 * Like Partial but makes certain properties optional
 *
 * @example `Optional<{ a: number, b: number }, 'b'>`
 */
export type Optional<T, K extends keyof T> = { [P in keyof T]: P extends K ? (NonNullable<T[P]> | undefined) : NonNullable<T[P]> };

/**
 * Without null or undefined properties
 */
export type WithoutNil<T> = { [P in keyof T]: T[P] extends (undefined | null) ? never : T[P] };

/** A simple definitions of array */
export interface Many<T> extends Array<T> {}

/** A simple object with any values */
export interface AnyObject {
    [prop: string]: any;
}

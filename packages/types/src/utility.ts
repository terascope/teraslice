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
export type Required<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? NonNullable<T[P]> : (NonNullable<T[P]> | undefined)
};

/**
 * Like Partial but makes certain properties optional
 *
 * @example `Optional<{ a: number, b: number }, 'b'>`
 */
export type Optional<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? (NonNullable<T[P]> | undefined) : NonNullable<T[P]>
};

export type Nil = null | undefined;
export type Maybe<T> = T | Nil;
export type Unwrapped<T> = NonNullable<T>;

/**
 * Without null or undefined properties
 */
export type WithoutNil<T> = { [P in keyof T]: T[P] extends Nil ? never : T[P] };

/** A simple definitions of array */

export interface Many<T> extends Array<T> {}

export interface RecursiveArray<T> extends Many<T|(RecursiveArray<T>)> {}

export interface ListOfRecursiveArraysOrValues<T> extends Many<T | RecursiveArray<T>> {}

export interface EmptyObject {}

/** A simple object with any values */
export interface AnyObject {
    [prop: string]: any;
}

/**
 * A deep partial object
*/
export type PartialDeep<T> = {
    [ P in keyof T ]?: PartialDeep<T[ P ]>;
};

/**
 * Remove types from T that are assignable to U
*/
export type Diff<T, U> = T extends U ? never : T;

/**
 * Remove types from T that are NOT assignable to U
*/
export type Filter<T, U> = T extends U ? T : never;

/**
 * Get the types object (the opposite of keyof)
*/
export type ValueOf<T> = T[keyof T];

/**
 * Filters the keys of an object (T), by list of included keys (I) and excluded (E)
*/
export type FilteredResult<T, I extends(keyof T), E extends (keyof T)> = {
    [P in keyof T]: P extends I ? T[P] : (
        P extends E ? never : T[P]
    )
};

/**
 * From https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-inference-in-conditional-types
*/
export type Unpacked<T>
= T extends (infer U)[] ? U

    : T extends (...args: any[]) => infer U ? U
        : T extends Promise<infer U> ? U
            : T;

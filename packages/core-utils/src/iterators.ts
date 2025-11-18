/**
 * Returns true if the input is an iterator
*/
export function isIterator<T>(input: unknown): input is Iterable<T> {
    return Symbol.iterator in Object(input);
}

/**
 * Returns true if the input is an async iterator
*/
export function isAsyncIterator<T>(input: unknown): input is AsyncIterable<T> {
    return Symbol.asyncIterator in Object(input);
}

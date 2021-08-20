/**
 * Returns true if the input is an iterator
*/
export function isIterator(input: unknown): input is Iterable<any> {
    return Symbol.iterator in Object(input);
}

/**
 * Returns true if the input is an async iterator
*/
export function isAsyncIterator(input: unknown): input is AsyncIterable<any> {
    return Symbol.asyncIterator in Object(input);
}

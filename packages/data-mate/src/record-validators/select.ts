import {} from '@terascope/utils';
// export function select(
//     input: RecordInput,
//     _parentContext: RecordInput,
//     args: DMOptions
// ): RecordInput|null {
//     const matcher = _validateMatcher(input, args);
//     if (!matcher) return null;

//     if (isArray(input)) {
//         const fn = (data: ts.AnyObject) => ts.isObjectEntity(data) && matcher.match(data);
//         return _filterBy(fn, input);
//     }

//     if (ts.isObjectEntity(input) && matcher.match(input)) return input;

//     return null;
// }

// function _validateMatcher(input: RecordInput, args: DMOptions) {
//     if (ts.isNil(input)) return null;
//     if (ts.isNil(args) || !ts.isObjectEntity(args)) {
//         throw new Error(`Parameter args must be provided and be an object, got ${ts.getTypeOf(args)}`);
//     }

//     const { query = '*', type_config, variables } = args;

//     if (!isString(query)) throw new Error(`Invalid query, must be a string, got ${ts.getTypeOf(args)}`);
//     if ((type_config && !ts.isObjectEntity(type_config))) throw new Error(`Invalid argument typeConfig must be an object got ${ts.getTypeOf(args)}`);
//     if ((variables && !ts.isObjectEntity(variables))) throw new Error(`Invalid argument variables must be an object got ${ts.getTypeOf(args)}`);

//     return new DocumentMatcher(query, { type_config, variables });
// }

// interface DMOptions {
//     query: string;
//     type_config?: xLuceneTypeConfig;
//     variables?: xLuceneVariables;
// }

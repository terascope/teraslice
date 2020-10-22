import { Logger } from '@terascope/utils';
import * as t from '@terascope/types';

export interface ParserOptions {
    type_config?: t.xLuceneTypeConfig;
}

export interface ContextArg {
    typeConfig?: t.xLuceneTypeConfig;
    variables?: t.xLuceneVariables;
}

export type AST = EmptyAST | LogicalGroup | Term
| Conjunction | Negation | FieldGroup
| Exists | Range | Regexp | Wildcard
| FunctionNode | TermList;

export type AnyAST = AST;

export type GroupLike = FieldGroup|LogicalGroup;
export type GroupLikeType = ASTType.LogicalGroup|ASTType.FieldGroup;

export interface GroupLikeAST {
    type: GroupLikeType;
    flow: Conjunction[];
}

export type TermLike = Term|Regexp|Range|Wildcard|FunctionNode;
export type TermLikeType =
    ASTType.Term|
    ASTType.Regexp|
    ASTType.Range|
    ASTType.Wildcard|
    ASTType.Function|
    ASTType.TermList;

export interface TermLikeAST {
    type: TermLikeType;
    field: Field;
    analyzed?: boolean;
}

export enum ASTType {
    LogicalGroup = 'logical-group',
    FieldGroup = 'field-group',
    Conjunction = 'conjunction',
    Negation = 'negation',
    Term = 'term',
    Exists = 'exists',
    Range = 'range',
    Regexp = 'regexp',
    Wildcard = 'wildcard',
    Empty = 'empty',
    Function = 'function',
    TermList = 'term-list',
}

export interface EmptyAST {
    type: ASTType.Empty;
    // we need this type for typescript to
    // detect the union correctly
    __empty?: boolean;
}

export type Field = string|null;

export type FieldValue<T> = {
    type: 'value';
    value: T;
}|{
    type: 'variable';
    value: string;
};

export interface TermList extends TermLikeAST {
    type: ASTType.TermList;
    value: FieldValue<any>[];
}

export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: t.xLuceneFieldType;
    value: FieldValue<string|number|boolean|any>;
}

export interface NumberDataType {
    field_type: t.xLuceneFieldType.Integer | t.xLuceneFieldType.Float;
    value: FieldValue<number>;
}

export interface StringDataType {
    field_type: t.xLuceneFieldType.String;
    value: FieldValue<string>;
    quoted: boolean;
    restricted?: boolean;
}

export interface BooleanDataType {
    field_type: t.xLuceneFieldType.Boolean;
    value: FieldValue<boolean>;
}

export interface LogicalGroup extends GroupLikeAST {
    type: ASTType.LogicalGroup;
    // we need this type for typescript to
    // detect the union correctly
    __logical_group?: boolean;
}

export interface Conjunction {
    type: ASTType.Conjunction;
    nodes: AST[];
    // we need this type for typescript to
    // detect the union correctly
    __conjunction?: boolean;
}

export interface Negation {
    type: ASTType.Negation;
    node: AST;
    // we need this type for typescript to
    // detect the union correctly
    __negation?: boolean;
}

export interface FieldGroup extends GroupLikeAST {
    type: ASTType.FieldGroup;
    field_type: t.xLuceneFieldType;
    field: string;
    // we need this type for typescript to
    // detect the union correctly
    __field_group?: boolean;
}

export interface Exists {
    type: ASTType.Exists;
    field: string;
    // we need this type for typescript to
    // detect the union correctly
    __exists?: boolean;
}

export type RangeOperator = 'gte'|'gt'|'lt'|'lte';
export interface Range extends TermLikeAST {
    type: ASTType.Range;
    field_type: t.xLuceneFieldType;
    left: RangeNode;
    right?: RangeNode;
    // we need this type for typescript to
    // detect the union correctly
    __range?: boolean;
}

export interface RangeNode {
    operator: RangeOperator;
    field_type: t.xLuceneFieldType.Integer
    | t.xLuceneFieldType.Float
    | t.xLuceneFieldType.String
    | t.xLuceneFieldType.AnalyzedString
    | t.xLuceneFieldType.Date
    | t.xLuceneFieldType.IP;
    value: FieldValue<number|string>;
}

export interface FunctionNode extends TermLikeAST {
    type: ASTType.Function;
    /**
     * The name of the function
    */
    name: string;
    description?: string;
    params: (Term|TermList)[];
    // we need this type for typescript to
    // detect the union correctly
    __function?: boolean;
}

export interface Regexp extends StringDataType, TermLikeAST {
    type: ASTType.Regexp;
    // we need this type for typescript to
    // detect the union correctly
    __regexp?: boolean;
}

export interface Wildcard extends StringDataType, TermLikeAST {
    type: ASTType.Wildcard;
    // we need this type for typescript to
    // detect the union correctly
    __wildcard?: boolean;
}

export interface Term extends AnyDataType, TermLikeAST {
    type: ASTType.Term;
    // we need this type for typescript to
    // detect the union correctly
    __term?: boolean;
}

export interface FunctionConfig {
    node: FunctionNode;
    type_config: t.xLuceneTypeConfig;
    variables: t.xLuceneVariables;
}

export interface FunctionDefinition {
    version: string;
    name: string;
    create: (config: FunctionConfig) => FunctionMethods;
}

export interface FunctionMethodsResults {
    query: t.AnyQuery;
    sort?: t.AnyQuerySort;
}

export type FunctionElasticsearchOptions =
    { logger: Logger; type_config: t.xLuceneTypeConfig }
    & Record<string, any>

export interface FunctionMethods {
    match(arg: any): boolean;
    toElasticsearchQuery(
        field: string,
        options: FunctionElasticsearchOptions
    ): FunctionMethodsResults;
}

import { Logger } from '@terascope/utils';
import * as t from '@terascope/types';

/**
 * @param filterNilVariables CAUTION: Filters out variable nodes that don't have
 * a variable provided in the variables object so make sure to pass in variables.
 */
export interface ParserOptions {
    type_config?: t.xLuceneTypeConfig;
    filterNilVariables?: boolean;
    variables?: t.xLuceneVariables;
}

export interface ContextArg {
    typeConfig?: t.xLuceneTypeConfig;
    variables?: t.xLuceneVariables;
}

export type GroupLike = FieldGroup | LogicalGroup;
export type GroupLikeType = NodeType.LogicalGroup | NodeType.FieldGroup;

export interface Node {
    type: NodeType;
}

export interface GroupLikeNode extends Node {
    type: GroupLikeType;
    flow: Conjunction[];
}

export type TermLikeType
    = NodeType.Term
        | NodeType.Regexp
        | NodeType.Range
        | NodeType.Wildcard
        | NodeType.Function
        | NodeType.TermList;

export interface TermLikeNode extends Node {
    type: TermLikeType;
    field: Field;
    analyzed?: boolean;
}

export enum NodeType {
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

export interface EmptyNode extends Node {
    type: NodeType.Empty;
}

export type Field = string | null;

export type FieldValueValue<T> = {
    type: 'value';
    value: T;
};
export type FieldValueVariable = {
    type: 'variable';
    scoped: boolean;
    value: string;
};

export type FieldValue<T> = FieldValueValue<T> | FieldValueVariable;

export interface TermList extends TermLikeNode {
    type: NodeType.TermList;
    value: FieldValue<any>[];
}

export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: t.xLuceneFieldType;
    value: FieldValue<string | number | boolean | any>;
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

export interface LogicalGroup extends GroupLikeNode {
    type: NodeType.LogicalGroup;
}

export interface Conjunction extends Node {
    type: NodeType.Conjunction;
    nodes: Node[];
}

export interface Negation extends Node {
    type: NodeType.Negation;
    node: Node;
}

export interface FieldGroup extends GroupLikeNode {
    type: NodeType.FieldGroup;
    field_type: t.xLuceneFieldType;
    field: string;
}

export interface Exists extends Node {
    type: NodeType.Exists;
    field: string;
}

export type RangeOperator = 'gte' | 'gt' | 'lt' | 'lte';
export interface Range extends TermLikeNode {
    type: NodeType.Range;
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
    value: FieldValue<number | string>;
}

export interface FunctionNode extends TermLikeNode {
    type: NodeType.Function;
    /**
     * The name of the function
    */
    name: string;
    description?: string;
    params: (Term | TermList)[];
}

export interface Regexp extends StringDataType, TermLikeNode {
    type: NodeType.Regexp;
}

export interface Wildcard extends StringDataType, TermLikeNode {
    type: NodeType.Wildcard;
}

export interface Term extends AnyDataType, TermLikeNode {
    type: NodeType.Term;
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

export type FunctionElasticsearchOptions
    = { logger: Logger; type_config: t.xLuceneTypeConfig }
        & Record<string, any>;

export interface FunctionMethods {
    match(arg: any): boolean;
    toElasticsearchQuery(
        field: string,
        options: FunctionElasticsearchOptions
    ): FunctionMethodsResults;
}

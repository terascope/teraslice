import { Logger } from '@terascope/utils';
import * as t from '@terascope/types';

/**
 * @param filterNilVariables CAUTION: Filters out variable nodes that don't have
 * a variable provided in the variables object so make sure to pass in variables.
 */
/**
 * Configuration options for the Parser constructor.
 */
export interface ParserOptions {
    type_config?: t.xLuceneTypeConfig;
    filterNilVariables?: boolean;
    variables?: t.xLuceneVariables;
}

/**
 * Context argument passed to the PEG parser engine.
 * @internal
 */
export interface ContextArg {
    typeConfig?: t.xLuceneTypeConfig;
    variables?: t.xLuceneVariables;
}

export type GroupLike = FieldGroup | LogicalGroup;
export type GroupLikeType = NodeType.LogicalGroup | NodeType.FieldGroup;

/**
 * Base interface for all AST nodes.
 * 
 * Every node in the Abstract Syntax Tree has a type property
 * that identifies what kind of node it is.
 */
export interface Node {
    type: NodeType;
}

/**
 * Base interface for nodes that contain logical flow (LogicalGroup and FieldGroup).
 * 
 * Group-like nodes organize other nodes into logical conjunctions,
 * representing AND/OR operations or field-scoped groupings.
 */
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

/**
 * Base interface for nodes that represent searchable terms.
 * 
 * Term-like nodes include actual search terms, ranges, wildcards,
 * regular expressions, and functions - anything that can be applied
 * to a field for matching.
 */
export interface TermLikeNode extends Node {
    type: TermLikeType;
    field: Field;
    analyzed?: boolean;
}

/**
 * Enumeration of all possible AST node types.
 * 
 * Each node in the parsed AST has one of these types, which determines
 * its structure and behavior.
 */
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

/**
 * Union type representing either a literal value or a variable reference.
 * 
 * Field values can be either concrete values or references to variables
 * that will be resolved later.
 */
export type FieldValue<T> = FieldValueValue<T> | FieldValueVariable;

/**
 * AST node representing a list of terms.
 * 
 * Term lists are used internally for function parameters
 * and other scenarios where multiple values are grouped.
 * 
 * @internal
 */
export interface TermList extends TermLikeNode {
    type: NodeType.TermList;
    value: FieldValue<any>[];
}

/**
 * Interface for nodes that can contain any type of data value.
 * 
 * This is the most general data type interface, used by Term nodes
 * that can contain strings, numbers, booleans, or other values.
 */
export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: t.xLuceneFieldType;
    value: FieldValue<string | number | boolean | any>;
}

/**
 * Interface for nodes that contain numeric data values.
 * 
 * Used by nodes that specifically work with integer or float values.
 */
export interface NumberDataType {
    field_type: t.xLuceneFieldType.Integer | t.xLuceneFieldType.Float;
    value: FieldValue<number>;
}

/**
 * Interface for nodes that contain string data values.
 * 
 * String data types track whether the value was quoted in the original
 * query and whether it has restricted characters.
 */
export interface StringDataType {
    field_type: t.xLuceneFieldType.String;
    value: FieldValue<string>;
    quoted: boolean;
    restricted?: boolean;
}

/**
 * Interface for nodes that contain boolean data values.
 */
export interface BooleanDataType {
    field_type: t.xLuceneFieldType.Boolean;
    value: FieldValue<boolean>;
}

/**
 * AST node representing a logical grouping of terms with AND/OR operations.
 * 
 * Logical groups organize multiple terms or sub-groups with boolean logic.
 * 
 * @example
 * Query: "name:John AND age:25" creates a LogicalGroup with two conjunctions
 */
export interface LogicalGroup extends GroupLikeNode {
    type: NodeType.LogicalGroup;
}

/**
 * AST node representing a conjunction of terms (implicit AND operation).
 * 
 * Conjunctions group multiple nodes that should all match.
 * 
 * @example
 * Query: "name:John age:25" creates a Conjunction with two Term nodes
 */
export interface Conjunction extends Node {
    type: NodeType.Conjunction;
    nodes: Node[];
}

/**
 * AST node representing a negated term or group.
 * 
 * Negations wrap another node and indicate it should NOT match.
 * 
 * @example
 * Query: "NOT name:John" creates a Negation containing a Term node
 */
export interface Negation extends Node {
    type: NodeType.Negation;
    node: Node;
}

/**
 * AST node representing multiple operations on the same field.
 * 
 * Field groups allow multiple conditions to be applied to a single field.
 * 
 * @example
 * Query: "age:(>=18 AND <=65)" creates a FieldGroup for the 'age' field
 */
export interface FieldGroup extends GroupLikeNode {
    type: NodeType.FieldGroup;
    field_type: t.xLuceneFieldType;
    field: string;
}

/**
 * AST node representing a field existence check.
 * 
 * Exists nodes check whether a field has any value (is not null/undefined).
 * 
 * @example
 * Query: "_exists_:name" creates an Exists node for the 'name' field
 */
export interface Exists extends Node {
    type: NodeType.Exists;
    field: string;
}

export type RangeOperator = 'gte' | 'gt' | 'lt' | 'lte';
/**
 * AST node representing a range query.
 * 
 * Range nodes specify numeric or string ranges with comparison operators.
 * They can have one or two bounds (left/right) with different operators.
 * 
 * @example
 * Query: "age:[18 TO 65]" creates a Range with gte and lte operators
 * Query: "score:>=90" creates a Range with only a left bound (gte)
 */
export interface Range extends TermLikeNode {
    type: NodeType.Range;
    field_type: t.xLuceneFieldType;
    left: RangeNode;
    right?: RangeNode;
    // we need this type for typescript to
    // detect the union correctly
    __range?: boolean;
}

/**
 * Configuration for one side of a range query.
 * 
 * Range nodes specify the operator (gte, gt, lt, lte) and the value
 * for one boundary of a range.
 */
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

/**
 * AST node representing a function call.
 * 
 * Function nodes represent specialized operations like geo queries
 * that take named parameters.
 * 
 * @example
 * Query: "location:geoDistance(point:"40,-74", distance:"10km")"
 * creates a FunctionNode with name="geoDistance" and parameters
 */
export interface FunctionNode extends TermLikeNode {
    type: NodeType.Function;
    /**
     * The name of the function
    */
    name: string;
    description?: string;
    params: (Term | TermList)[];
}

/**
 * AST node representing a regular expression pattern.
 * 
 * Regular expression nodes contain patterns for matching text.
 * 
 * @example
 * Query: "name:/[A-Z][a-z]+/" creates a Regexp node
 */
export interface Regexp extends StringDataType, TermLikeNode {
    type: NodeType.Regexp;
}

/**
 * AST node representing a wildcard pattern.
 * 
 * Wildcard nodes contain patterns with ? (single character) and
 * * (multiple characters) wildcards.
 * 
 * @example
 * Query: "name:J*n" creates a Wildcard node
 */
export interface Wildcard extends StringDataType, TermLikeNode {
    type: NodeType.Wildcard;
}

/**
 * AST node representing a simple term query.
 * 
 * Term nodes are the most basic type of query, representing
 * field-value pairs or standalone search terms.
 * 
 * @example
 * Query: "name:John" creates a Term node
 * Query: "hello" creates a Term node with null field
 */
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

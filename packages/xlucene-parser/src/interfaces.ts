import { Logger } from '@terascope/utils';
import * as t from '@terascope/types';

export interface ParserOptions {
    type_config?: t.xLuceneTypeConfig;
    logger?: Logger;
    variables?: t.xLuceneVariables;
}

export interface ContextArg {
    typeConfig?: t.xLuceneTypeConfig;
    variables?: t.xLuceneVariables;
}

export type AST = EmptyAST | LogicalGroup | Term
| Conjunction | Negation | FieldGroup
| Exists | Range | GeoDistance
| GeoBoundingBox | Regexp | Wildcard | FunctionNode;

export type AnyAST = AST;

export type GroupLike = FieldGroup|LogicalGroup;
export type GroupLikeType = ASTType.LogicalGroup|ASTType.FieldGroup;

export interface GroupLikeAST {
    type: GroupLikeType;
    flow: Conjunction[];
}

export type TermLike = Term|Regexp|Range|Wildcard|GeoBoundingBox|GeoDistance|FunctionNode;
export type TermLikeType =
    ASTType.Term|
    ASTType.Regexp|
    ASTType.Range|
    ASTType.Wildcard|
    ASTType.GeoBoundingBox|
    ASTType.GeoDistance|
    ASTType.Function

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
    GeoDistance = 'geo-distance',
    GeoBoundingBox = 'geo-bounding-box',
    Regexp = 'regexp',
    Wildcard = 'wildcard',
    Empty = 'empty',
    Function = 'function'
}

export interface EmptyAST {
    type: ASTType.Empty;
    // we need this type for typescript to
    // detect the union correctly
    __empty?: boolean;
}

export type Field = string|null;

export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: t.xLuceneFieldType;
    value: string|number|boolean|any;
}

export interface NumberDataType {
    field_type: t.xLuceneFieldType.Integer | t.xLuceneFieldType.Float;
    value: number;
}

export interface StringDataType {
    field_type: t.xLuceneFieldType.String;
    value: string;
    quoted: boolean;
    restricted?: boolean;
}

export interface BooleanDataType {
    field_type: t.xLuceneFieldType.Boolean;
    value: boolean;
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

export interface RangeNode extends NumberDataType {
    operator: RangeOperator;
}

export interface GeoDistance extends t.GeoPoint, TermLikeAST {
    type: ASTType.GeoDistance;
    field_type: t.xLuceneFieldType.Geo;
    distance: number;
    unit: t.GeoDistanceUnit;
    // we need this type for typescript to
    // detect the union correctly
    __geo_distance?: boolean;
}

export interface GeoBoundingBox extends TermLikeAST {
    type: ASTType.GeoBoundingBox;
    field_type: t.xLuceneFieldType.Geo;
    top_left: t.GeoPoint;
    bottom_right: t.GeoPoint;
    // we need this type for typescript to
    // detect the union correctly
    __geo_bounding_box?: boolean;
}

export interface FunctionNode extends TermLikeAST {
    type: ASTType.Function;
    name: string;
    description?: string;
    instance: FunctionMethods;
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
    logger: Logger;
    typeConfig: t.xLuceneTypeConfig;
}

export interface FunctionDefinition {
    version: string;
    name: string;
    create: (
        field: string,
        params: any,
        config: FunctionConfig
    ) => FunctionMethods;
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

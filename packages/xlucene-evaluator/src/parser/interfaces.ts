import { ConjunctionAST } from '../interfaces';

export type AST = EmptyAST & LogicalGroup & Term
    & Conjunction & Negation & FieldGroup
    & Exists & Range & GeoDistance
    & GeoBoundingBox & Regexp & Wildcard;

export interface EmptyAST {
    type: ASTType.Empty;
}

export enum ASTType {
    Conjunction = 'conjunction',
    LogicalGroup = 'logical-group',
    Negation = 'negation',
    FieldGroup = 'field-group',
    Term = 'term',
    Exists = 'exists',
    Range = 'range',
    GeoDistance = 'geo-distance',
    GeoBoundingBox = 'geo-bounding-box',
    Regexp = 'regexp',
    Wildcard = 'wildcard',
    Empty = 'empty'
}

export type Field = string|null;

export type DataType = 'string'|'number'|'integer'|'float'|'boolean';
export interface AnyDataType {
    data_type: DataType;
    value: string|number|boolean;
}

export interface NumberDataType {
    data_type: 'number'|'integer'|'float';
    value: number;
}

export interface StringDataType {
    data_type: 'string';
    value: string;
}

export interface BooleanDataType {
    data_type: 'boolean';
    value: boolean;
}

export interface LogicalGroup {
    type: ASTType.LogicalGroup;
    flow: Conjunction[];
}

export type Operator = 'AND'|'OR';
export interface Conjunction {
    type: ASTType.Conjunction;
    operator: Operator;
    nodes: AST[];
}

export interface Negation {
    type: ASTType.Negation;
    node: AST;
}

export interface FieldGroup {
    type: ASTType.FieldGroup;
    field: string;
    flow: ConjunctionAST;
}

export interface Exists {
    type: ASTType.Exists;
    field: string;
}

export type RangeOperator = 'gte'|'gt'|'lt'|'lte';
export interface Range {
    type: ASTType.Range;
    field: Field;
    left: RangeNode;
    right?: RangeNode;
}

export type GeoDistanceUnit = 'millimeters'|'centimeters'|'inches'|'feet'|'meters'|'yards'|'kilometers'|'nauticalmiles'|'miles';
export interface GeoDistance extends GeoPoint {
    type: ASTType.GeoDistance;
    field: Field;
    distance: number;
    unit: GeoDistanceUnit;
}

export interface GeoPoint {
    lat: number;
    lon: number;
}

export interface GeoBoundingBox {
    type: ASTType.GeoBoundingBox;
    field: string;
    top_left: GeoPoint;
    bottom_right: GeoPoint;
}

export interface RangeNode extends NumberDataType {
    operator: RangeOperator;
}

export interface Regexp extends StringDataType {
    type: ASTType.Regexp;
    field: Field;
}

export interface Wildcard extends StringDataType {
    type: ASTType.Wildcard;
    field: Field;
}

export interface Term extends AnyDataType {
    type: ASTType.Term;
    field: Field;
}

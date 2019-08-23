export type GeoDistanceUnit = 'miles'|'yards'|'feet'|'inch'|'kilometers'|'meters'|'centimeters'|'millimeters'|'nauticalmiles';

export enum FieldType {
    Geo = 'geo',
    Date = 'date',
    IP = 'ip',
    String = 'string',
    Integer = 'integer',
    Float = 'float',
    Boolean = 'boolean',
    Object = 'object'
}

export interface TypeConfig {
    [field: string]: FieldType;
}

export type AST = EmptyAST & LogicalGroup & Term
    & Conjunction & Negation & FieldGroup
    & Exists & Range & GeoDistance
    & GeoBoundingBox & Regexp & Wildcard;

export type AnyAST = EmptyAST | LogicalGroup | Term
    | Conjunction | Negation | FieldGroup
    | Exists | Range | GeoDistance
    | GeoBoundingBox | Regexp | Wildcard;

export type GroupLike = FieldGroup|LogicalGroup;
export type GroupLikeType = ASTType.LogicalGroup|ASTType.FieldGroup;

export interface GroupLikeAST {
    type: GroupLikeType;
    flow: Conjunction[];
}

export type TermLike = Term|Regexp|Range|Wildcard|GeoBoundingBox|GeoDistance;
export type TermLikeType = ASTType.Term|ASTType.Regexp|ASTType.Range|ASTType.Wildcard|ASTType.GeoBoundingBox|ASTType.GeoDistance;
export interface TermLikeAST {
    type: TermLikeType;
    field: Field;
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
}

export interface EmptyAST {
    type: ASTType.Empty;
}

export type Field = string|null;

export interface AnyDataType {
    /**
     * The field type here may be the field type specified
     * in the type_config
    */
    field_type: FieldType;
    value: string|number|boolean;
}

export interface NumberDataType {
    field_type: FieldType.Integer|FieldType.Float;
    value: number;
}

export interface StringDataType {
    field_type: FieldType.String;
    value: string;
}

export interface BooleanDataType {
    field_type: FieldType.Boolean;
    value: boolean;
}

export interface LogicalGroup extends GroupLikeAST {
    type: ASTType.LogicalGroup;
}

export interface Conjunction {
    type: ASTType.Conjunction;
    nodes: AST[];
}

export interface Negation {
    type: ASTType.Negation;
    node: AST;
}

export interface FieldGroup extends GroupLikeAST {
    type: ASTType.FieldGroup;
    field: string;
}

export interface Exists {
    type: ASTType.Exists;
    field: string;
}

export type RangeOperator = 'gte'|'gt'|'lt'|'lte';
export interface Range extends TermLikeAST {
    type: ASTType.Range;
    left: RangeNode;
    right?: RangeNode;
}

export interface RangeNode extends NumberDataType {
    operator: RangeOperator;
}

export interface GeoDistance extends GeoPoint, TermLikeAST {
    type: ASTType.GeoDistance;
    distance: number;
    unit: GeoDistanceUnit;
}

export interface GeoPoint {
    lat: number;
    lon: number;
}

export interface GeoBoundingBox extends TermLikeAST {
    type: ASTType.GeoBoundingBox;
    top_left: GeoPoint;
    bottom_right: GeoPoint;
}

export interface Regexp extends StringDataType, TermLikeAST {
    type: ASTType.Regexp;
}

export interface Wildcard extends StringDataType, TermLikeAST {
    type: ASTType.Wildcard;
}

export interface Term extends AnyDataType, TermLikeAST {
    type: ASTType.Term;
}

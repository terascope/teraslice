
import { Units } from '@turf/helpers';
import { TypeMapping } from './document-matcher/type-manager/types';

export { TypeMapping };

export type ImplicitField = '<implicit>';
export const IMPLICIT: ImplicitField = '<implicit>';

export type NodeType = 'conjunction'|'range'|'geo'|'term'|'exists';

export interface TypeConfig {
    [field: string]: keyof TypeMapping;
}

export type AST = RangeAST & TermAST
    & GeoAST & ExistsAST
    & WildcardAST & RegexpAST
    & ConjunctionAST;

interface BaseAST {
    type: NodeType;
}

export interface ConjunctionAST extends BaseAST {
    type: 'conjunction';

    left?: AST;
    right?: AST;
    operator: 'AND'|'OR'|'NOT'|ImplicitField;
    parens?: boolean;
    negated?: boolean;
    or?: boolean;
}

interface BaseFieldAST extends BaseAST {
    field: string|ImplicitField;
    negated?: boolean;
    or?: boolean;
}

export interface RangeAST extends BaseFieldAST {
    type: 'range';
    term_min: string|number;
    term_max: string|number;

    inclusive_min: boolean;
    inclusive_max: boolean;
}

export interface ExistsAST extends BaseFieldAST {
    type: 'exists';
}

export interface TermAST extends BaseFieldAST {
    type: 'term';

    unrestricted?: boolean;
    term: string|number|boolean;
    regexpr: boolean;
    wildcard: boolean;
    prefix?: boolean;
}

export interface RegexpAST extends TermAST {
    term: string;
    regexpr: true;
}

export interface WildcardAST extends TermAST {
    term: string;
    wildcard: true;
}

export interface GeoAST extends BaseFieldAST {
    type: 'geo';

    geo_distance?: string;
    geo_point?: string;
    geo_box_top_left?: string;
    geo_box_bottom_right?: string;
}

export interface AstCallback {
    (node: AST, _field: string, depth: number): void;
}

export interface GeoResults {
    geoField: string;
    geoBoxTopLeft?: string;
    geoBoxBottomRight?: string;
    geoPoint?: string;
    geoDistance?: string;
}

export interface GeoDistance {
    distance: number;
    unit: Units;
}

export type GeoPointArr = [number, number];
export type GeoPointStr = string;
export type GeoObjShort = {lat: string | number, lon: string | number};
export type GeoObjLong = {latitude: string | number, longitude: string | number};
export type GeoPoint = GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong;
export type DateInput = string | number;

export interface PegEngine {
    parse(input: string): AST;
}

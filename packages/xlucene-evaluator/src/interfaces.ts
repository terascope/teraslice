
import { Units } from '@turf/helpers';

export type ImplicitField = '<implicit>';
export type AST = ASTNode|ASTLeafNode;

export interface ASTLeafNode {
    field: string|ImplicitField;
    term?: string|number;
    inclusive_min?: string|number;
    inclusive_max?: string|number;
    term_min?: string|number;
    term_max?: string|number;
    regexpr?: boolean;

    // this will never exist on a leaf node
    left: never;
    right: never;
    operator: never;
    parens: never;
}

export interface ASTNode {
    left?: AST;
    right?: AST;
    field?: string;
    operator?: string;
    term?: string|number;
    parens?: boolean;

    // this will never exist on a root node
    inclusive_min: never;
    inclusive_max: never;
    term_min: never;
    term_max: never;
    regexpr: never;
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

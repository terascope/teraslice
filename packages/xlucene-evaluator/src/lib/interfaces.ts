
import { Units } from '@turf/helpers';

export interface AST {
    right?: AST;
    left?: AST;
    field?: string;
    operator?: string;
    term?: string|number;
    inclusive_min?: string|number;
    inclusive_max?: string|number;
    term_min?: string|number;
    term_max?: string|number;
    parens?: Boolean;
    regexpr?: Boolean;
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

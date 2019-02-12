
import { Units } from '@turf/helpers';
import { DateType, GeoType, IpType, StringType } from './document-matcher/type-manager/types';

export type ImplicitField = '<implicit>';
export interface AST {
    type?: keyof TypeMapping;

    field: string|ImplicitField;
    term?: string|number;
    inclusive_min?: boolean;
    inclusive_max?: boolean;
    term_min?: string|number;
    term_max?: string|number;
    regexpr?: boolean;
    wildcard?: boolean;

    geo_distance?: string;
    geo_point?: string;
    geo_box_top_left?: string;
    geo_box_bottom_right?: string;

    // Root Node Only
    left?: AST;
    right?: AST;
    operator?: string;
    parens?: boolean;

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

export interface TypeMapping {
    date: new(input: object) => DateType;
    ip: new(input: object) => IpType;
    geo: new(input: object) => GeoType;
    string: new(input: object) => StringType;
}

export interface TypeConfig {
    [field: string]: keyof TypeMapping;
}

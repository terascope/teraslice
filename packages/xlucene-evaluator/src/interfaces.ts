import { Units } from '@turf/helpers';

export type FieldType = 'geo'|'date'|'ip';
export interface TypeConfig {
    [field: string]: FieldType;
}

export type BooleanCB = (data: any) => boolean;

export type GeoPointArr = [number, number];
export type GeoPointStr = string;
export type GeoObjShort = {lat: string | number, lon: string | number};
export type GeoObjLong = {latitude: string | number, longitude: string | number};
export type GeoPointInput = GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong;
export type DateInput = string | number;
export interface GeoDistanceObj {
    distance: number;
    unit: Units;
}

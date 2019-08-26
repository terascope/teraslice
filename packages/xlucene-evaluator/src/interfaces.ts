import { GeoDistanceUnit } from './parser';

type GeoPointArr = [number, number];
type GeoPointStr = string;
type GeoObjShort = {lat: string | number; lon: string | number};
type GeoObjLong = {latitude: string | number; longitude: string | number};
export type GeoPointInput = GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong | number[] | object;
export interface GeoDistanceObj {
    distance: number;
    unit: GeoDistanceUnit;
}

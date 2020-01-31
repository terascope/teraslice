import { EmptyObject } from '@terascope/utils';

export type RepoConfig = Config | EmptyObject;

export interface Repository {
    [key: string]: {
        fn: any;
        config: RepoConfig;
    };
}

interface Config {
    [key: string]: {
        type: string;
    };
}

export enum ESGeoShapeType {
    Point = 'point',
    Polygon = 'polygon',
    MultiPolygon = 'multipolygon'
}

export type ESGeoShapePoint = {
    type: ESGeoShapeType.Point;
    coordinates: CoordinateTuple;
}

export type ESGeoShapePolygon = {
    type: ESGeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
}

export type ESGeoShapeMultiPolygon = {
    type: ESGeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
}

export type ESGeoShape = ESGeoShapePoint | ESGeoShapePolygon | ESGeoShapeMultiPolygon

export enum GeoShapeType {
    Point = 'Point',
    Polygon = 'Polygon',
    MultiPolygon = 'MultiPolygon',
}

export type GeoShapePoint = {
    type: GeoShapeType.Point;
    coordinates: CoordinateTuple;
}

export type GeoShapePolygon = {
    type: GeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
}

export type GeoShapeMultiPolygon = {
    type: GeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
}

export type GeoShape = GeoShapePoint | GeoShapePolygon | GeoShapeMultiPolygon;

export type JoinGeoShape = GeoShape | ESGeoShape;

export type CoordinateTuple = [number, number];

type GeoPointArr = [number, number];
type GeoPointStr = string;
type GeoObjShort = { lat: string | number; lon: string | number };
type GeoObjLong = { latitude: string | number; longitude: string | number };

export type GeoPointInput =
    GeoPointArr|
    GeoPointStr|
    GeoObjShort|
    GeoObjLong|
    GeoShapePoint;

export interface GeoPoint {
    lat: number;
    lon: number;
}

import {
    GeoShape, GeoShapeType, CoordinateTuple, GeoShapePoint, GeoShapePolygon, GeoShapeMultiPolygon
} from '@terascope/types';

/**
 * GeoJSON <-> WKB, for a `GeoJSON` column stored as a DuckDB `GEOMETRY`.
 *
 * **Why this exists.** A `GEOMETRY` column is WKB underneath, and the node binding can write one
 * only as WKB bytes through a data-chunk vector - its single-value `createValue` has no GEOMETRY
 * case, because DuckDB's C API has no geometry constructor. So ingest encodes here, and `rows()`
 * decodes here. Everything spatial after that is DuckDB's.
 *
 * ISO WKB, 2D, little-endian on the way out; either byte order on the way in. The shapes are the
 * three a `GeoShape` can be - `toGeoJSONOrThrow` produces nothing else - so a type outside them is
 * a `TypeError`, which ingest records as a coercion failure rather than storing something else.
*/

const WKB_POINT = 1;
const WKB_POLYGON = 3;
const WKB_MULTI_POLYGON = 6;

/** `GeoShapeType` by its lowercase spelling, so Elasticsearch's `'polygon'` is the same shape. */
const SHAPE_TYPES: Readonly<Record<string, number>> = {
    point: WKB_POINT,
    polygon: WKB_POLYGON,
    multipolygon: WKB_MULTI_POLYGON,
};

const HEADER_BYTES = 5; // byte order + uint32 type
const POINT_BYTES = 16; // two float64

type Ring = readonly CoordinateTuple[];
type Polygon = readonly Ring[];

/** Encodes a GeoShape as little-endian ISO WKB - the bytes DuckDB's `ST_AsWKB` would write. */
export function geoShapeToWKB(shape: GeoShape): Uint8Array {
    const code = SHAPE_TYPES[String(shape?.type).toLowerCase()];
    if (code == null) {
        throw new TypeError(`Cannot store a geometry of type ${JSON.stringify(shape?.type)}`);
    }

    const { coordinates } = shape as { coordinates: unknown };
    if (code === WKB_POINT) return writePoint(toPosition(coordinates));
    if (code === WKB_POLYGON) return writePolygon(toPolygon(coordinates));
    return writeMultiPolygon(toList(coordinates, 'a MultiPolygon').map(toPolygon));
}

/** Decodes WKB of a Point, Polygon or MultiPolygon, in either byte order, to a GeoShape. */
export function wkbToGeoShape(bytes: Uint8Array): GeoShape {
    return new WKBReader(bytes).readGeometry();
}

function writePoint(position: CoordinateTuple): Uint8Array {
    const out = new DataView(new ArrayBuffer(HEADER_BYTES + POINT_BYTES));
    writeHeader(out, 0, WKB_POINT);
    writePosition(out, HEADER_BYTES, position);
    return new Uint8Array(out.buffer);
}

function polygonBytes(polygon: Polygon): number {
    return HEADER_BYTES + 4
        + polygon.reduce((sum, ring) => sum + 4 + ring.length * POINT_BYTES, 0);
}

function writePolygon(polygon: Polygon): Uint8Array {
    const out = new DataView(new ArrayBuffer(polygonBytes(polygon)));
    writePolygonAt(out, 0, polygon);
    return new Uint8Array(out.buffer);
}

function writeMultiPolygon(polygons: readonly Polygon[]): Uint8Array {
    const size = HEADER_BYTES + 4 + polygons.reduce((sum, p) => sum + polygonBytes(p), 0);
    const out = new DataView(new ArrayBuffer(size));
    writeHeader(out, 0, WKB_MULTI_POLYGON);
    out.setUint32(HEADER_BYTES, polygons.length, true);

    let offset = HEADER_BYTES + 4;
    for (const polygon of polygons) offset = writePolygonAt(out, offset, polygon);
    return new Uint8Array(out.buffer);
}

/** Writes one polygon at `offset`, returning the offset after it. */
function writePolygonAt(out: DataView, start: number, polygon: Polygon): number {
    writeHeader(out, start, WKB_POLYGON);
    out.setUint32(start + HEADER_BYTES, polygon.length, true);

    let offset = start + HEADER_BYTES + 4;
    for (const ring of polygon) {
        out.setUint32(offset, ring.length, true);
        offset += 4;
        for (const position of ring) {
            writePosition(out, offset, position);
            offset += POINT_BYTES;
        }
    }
    return offset;
}

function writeHeader(out: DataView, offset: number, code: number): void {
    out.setUint8(offset, 1); // little-endian
    out.setUint32(offset + 1, code, true);
}

function writePosition(out: DataView, offset: number, [x, y]: CoordinateTuple): void {
    out.setFloat64(offset, x, true);
    out.setFloat64(offset + 8, y, true);
}

function toList(value: unknown, what: string): readonly unknown[] {
    if (!Array.isArray(value)) throw new TypeError(`Expected ${what} to be an array`);
    return value;
}

function toPolygon(value: unknown): Polygon {
    return toList(value, 'a Polygon').map((ring) => toList(ring, 'a ring').map(toPosition));
}

/**
 * A 2D position. **A third ordinate is rejected, not dropped** - `CoordinateTuple` is 2D, and
 * silently storing a different shape than the one given is the one outcome this must not have.
*/
function toPosition(value: unknown): CoordinateTuple {
    const position = toList(value, 'a position');
    if (position.length !== 2) {
        throw new TypeError(`Expected a 2D position, got ${position.length} ordinates`);
    }
    const [x, y] = position;
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new TypeError(`Expected numeric ordinates, got ${JSON.stringify(position)}`);
    }
    return [x, y];
}

/** A cursor over WKB bytes; each geometry carries its own byte order. */
class WKBReader {
    private readonly view: DataView;

    private offset = 0;

    constructor(bytes: Uint8Array) {
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }

    readGeometry(): GeoShape {
        const little = this.view.getUint8(this.offset) === 1;
        const code = this.view.getUint32(this.offset + 1, little);
        this.offset += HEADER_BYTES;

        if (code === WKB_POINT) {
            const point: GeoShapePoint = {
                type: GeoShapeType.Point, coordinates: this.readPosition(little),
            };
            return point;
        }
        if (code === WKB_POLYGON) {
            const polygon: GeoShapePolygon = {
                type: GeoShapeType.Polygon, coordinates: this.readPolygonBody(little),
            };
            return polygon;
        }
        if (code === WKB_MULTI_POLYGON) {
            const count = this.readCount(little);
            const coordinates = Array.from({ length: count }, () => {
                const inner = this.readGeometry();
                if (inner.type !== GeoShapeType.Polygon) {
                    throw new TypeError('A MultiPolygon member must be a Polygon');
                }
                return inner.coordinates;
            });
            const multi: GeoShapeMultiPolygon = { type: GeoShapeType.MultiPolygon, coordinates };
            return multi;
        }
        throw new TypeError(`WKB geometry type ${code} is not a Point, Polygon or MultiPolygon`);
    }

    private readPolygonBody(little: boolean): CoordinateTuple[][] {
        const rings = this.readCount(little);
        return Array.from({ length: rings }, () => {
            const points = this.readCount(little);
            return Array.from({ length: points }, () => this.readPosition(little));
        });
    }

    private readCount(little: boolean): number {
        const count = this.view.getUint32(this.offset, little);
        this.offset += 4;
        return count;
    }

    private readPosition(little: boolean): CoordinateTuple {
        const x = this.view.getFloat64(this.offset, little);
        const y = this.view.getFloat64(this.offset + 8, little);
        this.offset += POINT_BYTES;
        return [x, y];
    }
}

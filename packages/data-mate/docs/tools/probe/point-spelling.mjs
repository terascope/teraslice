/* eslint-disable no-console -- a probe's output IS its result */
// The only rows the GEOMETRY change flips: is it exactly the { type: 'POINT' } spelling?
import { geoDisjointFP, geoRelationFP, isGeoShapePoint } from '@terascope/geo-utils';
const box = { type: 'Polygon', coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]] };
for (const type of ['Point', 'point', 'POINT']) {
    const p = { type, coordinates: [10, 20] };
    console.log(type.padEnd(6), 'disjoint', geoDisjointFP(box)(p), ' relation(disjoint)', geoRelationFP(box, 'disjoint')(p), ' isGeoShapePoint', isGeoShapePoint(p));
}

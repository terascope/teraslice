/**
 * Do the geo predicates actually disagree with DuckDB's spatial functions, and where exactly?
 *
 * The verdict this replaces was ASSERTED, not measured: "turf's `booleanPointInPolygon` and
 * `ST_Contains` disagree at boundaries and on the antimeridian". Measured on turf 7.4.0, over the
 * full NxN matrix of the shapes below - squares, reversed winding, edge-sharing, corner-only
 * touching, overlaps, single and double holes, MultiPolygon with and without holes, and points on
 * the interior, an edge, a vertex, a hole edge and outside:
 *
 *   geoIntersects   MATCHES all 324
 *   geoDisjoint     MATCHES all 324
 *   geoContains     1 of 256 diverge   (a shape TOUCHING a hole boundary)
 *   geoWithin       1 of 256 diverge   (the mirror of the same case)
 *   geoRelation     3 of 324 diverge   (both of the above, plus a POINT on a hole edge)
 *
 * `geoContains`/`geoWithin` split each shape into shell polygons and hole polygons and ask
 * `booleanIntersects(queryPolygon, holePolygon)` - which is boundary-inclusive - so a shape that
 * merely touches a hole's edge is treated as being INSIDE the hole and therefore not contained.
 * `ST_Contains` applies OGC semantics and answers true, which is geometrically right.
 *
 * `geoPointWithinRange` is not tested here because it is not a spatial predicate at all: it builds
 * a turf CIRCLE POLYGON (64 sides by default) and runs point-in-polygon against it. See
 * `docs/sql-emission.md` for the measured band.
 *
 * Requires an explicit `LOAD spatial` - unlike `inet`, it does NOT autoload: a bare `ST_Intersects`
 * is `Catalog Error: Scalar Function with name "st_intersects" is not in the catalog`.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/package.json');
const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
const gu = await import(pathToFileURL('/Users/jarednoble/Projects/terascope/teraslice/packages/geo-utils/dist/src/index.js').href);
const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run('LOAD spatial');
const q = async (s) => { try { return (await (await c.run(`SELECT ${s}`)).getRowsJson())[0][0]; } catch(e){ return 'ERR '+String(e.message).slice(0,45);} };
const G = (o) => `ST_GeomFromGeoJSON('${JSON.stringify(o).replace(/'/g,"''")}')`;
const S = {
  sq:{type:'Polygon',coordinates:[[[0,0],[0,10],[10,10],[10,0],[0,0]]]},
  sqCW:{type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]]]},
  inner:{type:'Polygon',coordinates:[[[2,2],[2,8],[8,8],[8,2],[2,2]]]},
  touch:{type:'Polygon',coordinates:[[[10,0],[10,10],[20,10],[20,0],[10,0]]]},
  corner:{type:'Polygon',coordinates:[[[10,10],[10,20],[20,20],[20,10],[10,10]]]},
  over:{type:'Polygon',coordinates:[[[5,5],[5,15],[15,15],[15,5],[5,5]]]},
  far:{type:'Polygon',coordinates:[[[50,50],[50,60],[60,60],[60,50],[50,50]]]},
  holed:{type:'Polygon',coordinates:[[[0,0],[0,10],[10,10],[10,0],[0,0]],[[4,4],[4,6],[6,6],[6,4],[4,4]]]},
  holed2:{type:'Polygon',coordinates:[[[0,0],[0,20],[20,20],[20,0],[0,0]],[[2,2],[2,8],[8,8],[8,2],[2,2]],[[12,12],[12,18],[18,18],[18,12],[12,12]]]},
  inHole:{type:'Polygon',coordinates:[[[4.5,4.5],[4.5,5.5],[5.5,5.5],[5.5,4.5],[4.5,4.5]]]},
  onHoleEdge:{type:'Polygon',coordinates:[[[3,4],[3,6],[4,6],[4,4],[3,4]]]},
  multi:{type:'MultiPolygon',coordinates:[[[[0,0],[0,4],[4,4],[4,0],[0,0]]],[[[6,6],[6,10],[10,10],[10,6],[6,6]]]]},
  multiHoled:{type:'MultiPolygon',coordinates:[[[[0,0],[0,10],[10,10],[10,0],[0,0]],[[4,4],[4,6],[6,6],[6,4],[4,4]]],[[[20,20],[20,30],[30,30],[30,20],[20,20]]]]},
  pt:{type:'Point',coordinates:[5,5]},
  ptEdge:{type:'Point',coordinates:[0,5]},
  ptVert:{type:'Point',coordinates:[0,0]},
  ptHoleEdge:{type:'Point',coordinates:[4,5]},
  ptOut:{type:'Point',coordinates:[50,50]},
};
const K = Object.keys(S);
for (const [name, js, fn] of [
  ['geoIntersects', (i,a)=>gu.geoIntersects(i,a), 'ST_Intersects'],
  ['geoDisjoint',   (i,a)=>gu.geoDisjoint(i,a),   'ST_Disjoint'],
]) {
  const bad=[]; let n=0;
  for (const ki of K) for (const ka of K) {
    n++;
    let j; try { j = js(S[ki],S[ka]); } catch(e){ j='THROWS'; }
    const s = await q(`${fn}(${G(S[ki])}, ${G(S[ka])})`);
    if (String(j)!==String(s)) bad.push([ki,ka,j,s]);
  }
  console.log(`${name}: ${bad.length ? bad.length+' of '+n+' DIVERGE' : 'MATCHES all '+n}`);
  for (const [ki,ka,j,s] of bad.slice(0,12)) console.log(`   input=${ki.padEnd(11)} arg=${ka.padEnd(11)} turf=${String(j).padEnd(6)} sql=${s}`);
}

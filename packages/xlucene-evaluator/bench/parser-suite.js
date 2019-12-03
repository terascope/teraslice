'use strict';

const { times } = require('@terascope/utils');
const turf = require('@turf/random');
const { Suite } = require('./helpers');
const { Parser, createJoinQuery, FieldType } = require('../dist/src');
const greenlandGeoData = require('./fixtures/greenland.json');

const featureCollection = turf.randomPolygon(1, { num_vertices: 800 });
const [polygon] = featureCollection.features;

const polyInput = { location: polygon.geometry };
const multipolyInput = { location: greenlandGeoData };

const typeConfig = { location: FieldType.GeoJSON };

const geoPolygonQuery = createJoinQuery(polyInput, { typeConfig });
const geoMultiPolygonQuery = createJoinQuery(multipolyInput, { typeConfig });

const partOne = times(300, (n) => `a:${n}`).join(' OR ');
const partTwo = times(200, (n) => `b:${n}`).join(' OR ');
const partThree = times(300, (n) => `c:${n}`).join(') OR (');
const largeTermQuery = `(${partOne}) AND ${partTwo} OR (${partThree})`;

const run = async () => Suite('Parser (large)')
    // .add('parsing large geoPolygon queries', {
    //     fn() {
    //         new Parser(geoPolygonQuery, typeConfig);
    //     }
    // })
    .add('parsing large multipolygon geoPolygon queries', {
        fn() {
            new Parser(geoMultiPolygonQuery, typeConfig);
        }
    })
    // .add('parsing large term queries', {
    //     fn() {
    //         new Parser(largeTermQuery);
    //     }
    // })
    // .add('parsing small term queries', {
    //     fn() {
    //         new Parser('foo: bar AND foo: "bar" AND hello: true AND a: 1');
    //     }
    // })
    .run({
        async: true,
        initCount: 0,
        maxTime: 1,
    });

if (require.main === module) {
    console.time('run');
    new Parser(geoMultiPolygonQuery, typeConfig);
    console.timeEnd('run');
    // run().then((suite) => {
    //     suite.on('complete', () => {});
    // });
} else {
    module.exports = run;
}

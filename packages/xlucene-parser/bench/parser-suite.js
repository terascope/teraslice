'use strict';

const { times } = require('@terascope/utils');
const turf = require('@turf/random');
const { multiPolygon } = require('@turf/helpers');
const { xLuceneFieldType } = require('@terascope/types');
const { toXluceneQuery } = require('@terascope/data-mate');
const { Suite } = require('./helpers');
const { Parser } = require('../dist/src');
const greenlandGeoData = require('./fixtures/greenland.json');

const featureCollection = turf.randomPolygon(1, { num_vertices: 800 });
const [polygon] = featureCollection.features;

const multiCollection = turf.randomPolygon(2, { num_vertices: 400 });
const [mPoly1, mPoly2] = multiCollection.features;

const polyInput = { location: polygon.geometry };
const multipolyInput = { location: multiPolygon([mPoly1, mPoly2]).geometry };
const largeMultipolyInput = { location: greenlandGeoData };

const typeConfig = { location: xLuceneFieldType.GeoJSON };

const { query: polyQuery, variables: polyVariables } = toXluceneQuery(polyInput, { typeConfig });

const {
    query: multiPolyQuery,
    variables: multiPolyVariables
} = toXluceneQuery(multipolyInput, { typeConfig });

const {
    query: largeMultiPolyQuery,
    variables: largeMultiPolyVariables
} = toXluceneQuery(largeMultipolyInput, { typeConfig });

const multiPolyConfig = {
    type_config: typeConfig,
    variables: multiPolyVariables
};

const largeMultiPolyConfig = {
    type_config: typeConfig,
    variables: largeMultiPolyVariables
};

const polyConfig = {
    type_config: typeConfig,
    variables: polyVariables
};

const partOne = times(300, (n) => `a:${n}`).join(' OR ');
const partTwo = times(200, (n) => `b:${n}`).join(' OR ');
const partThree = times(300, (n) => `c:${n}`).join(') OR (');
const largeTermQuery = `(${partOne}) AND ${partTwo} OR (${partThree})`;

const run = async () => Suite('Parser')
    .add('parsing geoPolygon queries', {
        fn() {
            new Parser(polyQuery, polyConfig);
        }
    })
    .add('parsing multipolygon geoPolygon queries', {
        fn() {
            new Parser(multiPolyQuery, multiPolyConfig);
        }
    })
    .add('parsing large multipolygon geoPolygon queries', {
        fn() {
            new Parser(largeMultiPolyQuery, largeMultiPolyConfig);
        }
    })
    .add('parsing large term queries', {
        fn() {
            new Parser(largeTermQuery);
        }
    })
    .add('parsing small term queries', {
        fn() {
            new Parser('foo: bar AND foo: "bar" AND hello: true AND a: 1');
        }
    })
    .run({
        async: false,
        initCount: 2,
        maxTime: 10,
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}

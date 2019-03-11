'use strict';

const Promise = require('bluebird');
const { debugLogger } = require('@terascope/utils');
const { getOffsets, getChunk, _averageRecordSize } = require('../lib');

// Mock logger
const logger = debugLogger('chunked-file-reader');

// Mock reader
function Reader(reads) {
    return () => Promise.resolve(reads.shift());
}

const jsonOpConfig = {
    delimiter: '\n',
    format: 'json',
    _dead_letter_action: 'none'
};

const multiCharOpConfig = {
    delimiter: '\r\n\f',
    format: 'json',
    _dead_letter_action: 'none'
};

const rawOpConfig = {
    delimiter: '\n',
    format: 'raw',
    _dead_letter_action: 'none'
};

const metadata = {
    path: '/test/file'
};

describe('The chunked file reader', () => {
    // Test with a check to see if `getMetadata()` works for a record
    it('returna a DataEntity for JSON data.', (done) => {
        const slice = { offset: 100, length: 5, total: 30 };
        const reader = Reader([
            '\n{"test4": "data"}\n{"test5": data}\n{"test6": "data"}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data[0].getMetadata().path).toEqual('/test/file');
                done();
            });
    });
    // Test with a check to see if `getMetadata()` works for a record
    it('returna a DataEntity for `raw` data.', (done) => {
        const slice = { offset: 100, length: 5, total: 30 };
        const reader = Reader([
            '\n{"test4": "data"}\n{"test5": data}\n{"test6": "data"}\n',
        ]);
        getChunk(reader, slice, rawOpConfig, logger, metadata)
            .then((data) => {
                expect(data[0].getMetadata().path).toEqual('/test/file');
                done();
            });
    });
    it('does not let one bad JSON record spoil the bunch.', (done) => {
        const slice = { offset: 100, length: 5, total: 30 };
        const reader = Reader([
            '\n{"test4": "data"}\n{"test5": data}\n{"test6": "data"}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data).toEqual([{ test4: 'data' }, null, { test6: 'data' }]);
                done();
            });
    });
    it('supports multi-character delimiters.', (done) => {
        const slice = { offset: 0, length: 5, total: 30 };
        const reader = Reader([
            '{"test4": "data"}\r\n\f{"test5": "data"}\r\n\f',
        ]);
        getChunk(reader, slice, multiCharOpConfig, metadata, logger)
            .then((data) => {
                expect(data).toEqual([{ test4: 'data' }, { test5: 'data' }]);
                done();
            });
    });
    it('handles a start slice and margin collection.', (done) => {
        const slice = { offset: 0, length: 5, total: 30 };
        const reader = Reader([
            '{"test1": "data"}\n{"test2": "data"}\n{"test3": "data"',
            '}\n{"test4": "data"}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data).toEqual([{ test1: 'data' }, { test2: 'data' }, { test3: 'data' }]);
                done();
            });
    });
    it('handles reading margin until delimiter found.', (done) => {
        const slice = { offset: 0, length: 5, total: 112 };
        const reader = Reader([
            '{"t1":"d"}\n{"t2":"d"}\n{"t3":"d", ',
            '"x": "abcdefghijklmnopqrstuz", ',
            '"y": "ABCDEFGHIJKLMNOPQRSTUZ", ',
            '"z": 123456789}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                const t3 = {
                    t3: 'd',
                    x: 'abcdefghijklmnopqrstuz',
                    y: 'ABCDEFGHIJKLMNOPQRSTUZ',
                    z: 123456789,
                };
                expect(data).toEqual([{ t1: 'd' }, { t2: 'd' }, t3]);
                done();
            });
    });
    it('handles reading margin when delimiter never found.', (done) => {
        const slice = { offset: 0, length: 5, total: 95 };
        const reader = Reader([
            '{"t1":"d"}\n{"t2":"d"}\n{"t3":"d", ',
            '"x": "abcdefghijklmnopqrstuz", ',
            '"y": "ABCDEFGHIJKLMNOPQRSTUZ", ',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data).toEqual([{ t1: 'd' }, { t2: 'd' }, null]);
                done();
            });
    });
    it('handles a middle slice with a complete record and no margin.', (done) => {
        const slice = { offset: 10, length: 10, total: 30 };
        const reader = Reader([
            '\n{"test4": "data"}\n{"test5": "data"}\n{"test6": "data"}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data).toEqual([{ test4: 'data' }, { test5: 'data' }, { test6: 'data' }]);
                done();
            });
    });
    it('handles an end slice starting with a partial record.', (done) => {
        const slice = { offset: 20, length: 10, total: 30 };
        const reader = Reader([
            '{"test6": "data"}\n{"test7": "data"}\n{"test8": "data"}\n',
        ]);
        getChunk(reader, slice, jsonOpConfig, logger, metadata)
            .then((data) => {
                expect(data).toEqual([{ test7: 'data' }, { test8: 'data' }]);
                done();
            });
    });
    it('accurately calculates average record size.', () => {
        const records = [
            '{"test1":"data"}',
            '{"test2":"data"}',
            '{"test3":"data"}',
            '{"test4":"data"}',
            '{"test5":"data"}',
            '{"test6":"data"}',
            '{"test7":"data"}',
            '{"test8":"data"}'
        ];
        const avgSize = _averageRecordSize(records);
        expect(avgSize).toEqual(16);
    });
    it('computes offsets', () => {
        expect(getOffsets(10, 0, '\n')).toEqual([]);
        expect(getOffsets(10, 9, '\n')).toEqual([
            { offset: 0, length: 9 },
        ]);
        expect(getOffsets(10, 10, '\n')).toEqual([
            { offset: 0, length: 10 },
        ]);
        expect(getOffsets(10, 15, '\n')).toEqual([
            { offset: 0, length: 10 },
            { offset: 9, length: 6 },
        ]);
        expect(getOffsets(10, 20, '\n')).toEqual([
            { offset: 0, length: 10 },
            { offset: 9, length: 11 },
        ]);
        expect(getOffsets(10, 20, '\r\n')).toEqual([
            { offset: 0, length: 10 },
            { offset: 8, length: 12 },
        ]);
        expect(getOffsets(10, 21, '\r\n')).toEqual([
            { offset: 0, length: 10 },
            { offset: 8, length: 12 },
            { offset: 18, length: 3 },
        ]);
    });
});

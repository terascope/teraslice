import 'jest-extended';
import {
    isSimpleIndex,
    isTemplatedIndex,
    isTimeSeriesIndex
} from '../src';

describe('ElasticSearch Store Utils', () => {
    describe('#isSimpleIndex', () => {
        it('should return true when given a simple index', () => {
            expect(isSimpleIndex({
                mapping: {},
                version: 1
            })).toBeTrue();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isSimpleIndex({
                version: 'v1'
            })).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            // @ts-ignore
            expect(isSimpleIndex({
                mapping: {},
                template: true,
                version: 1
            })).toBeFalse();
        });
    });

    describe('#isTemplatedIndex', () => {
        it('should return false when given a simple index', () => {
            expect(isTemplatedIndex({
                mapping: {},
                template: false,
                version: 1
            })).toBeFalse();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                version: 'v1'
            })).toBeFalse();
        });

        it('should return true when given a templated index', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                mapping: {},
                template: true,
                version: 'v1'
            })).toBeTrue();
        });

        it('should return true when given a timeseries index', () => {
            // @ts-ignore
            expect(isTemplatedIndex({
                mapping: {},
                template: true,
                timeseries: true,
                version: 1
            })).toBeTrue();
        });
    });

    describe('#isTimeSeriesIndex', () => {
        it('should return false when given a simple index', () => {
            expect(isTimeSeriesIndex({
                mapping: {},
                template: false,
                version: 1
            })).toBeFalse();
        });

        it('should return false when given missing map', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                version: 1
            })).toBeFalse();
        });

        it('should return false when given a templated index', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                mapping: {},
                template: true,
                version: 1
            })).toBeFalse();
        });

        it('should return true when given a timeseries index', () => {
            // @ts-ignore
            expect(isTimeSeriesIndex({
                mapping: {},
                template: true,
                timeseries: true,
                version: 1
            })).toBeTrue();
        });
    });
});

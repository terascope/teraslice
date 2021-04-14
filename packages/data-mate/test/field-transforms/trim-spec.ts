/* eslint-disable @typescript-eslint/no-unused-vars */
import 'jest-extended';
import {
    cloneDeep, DataEntity,
    isEmpty, isNotNil, withoutNil,
} from '@terascope/utils';
import {
    FieldType, Maybe, GeoPointInput, GeoPoint
} from '@terascope/types';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter
} from '../../src';
import { ColumnTests, RowsTests } from '../interfaces';

const trimConfig = functionConfigRepository.trim;

describe('trimConfig', () => {
    it('has proper configuration', () => {
        expect(trimConfig).toBeDefined();
        expect(trimConfig).toHaveProperty('name', 'trim');
        expect(trimConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(trimConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(trimConfig).toHaveProperty('description');
        expect(trimConfig).toHaveProperty('accepts', [
            FieldType.String,
        ]);
        expect(trimConfig).toHaveProperty('create');
        expect(trimConfig.create).toBeFunction();
    });

    it('can trim whitespace', () => {
        const values = [' hello ', '   left', 'right   ', '    ', null];
        const expected = [
            'hello',
            'left',
            'right',
            '',
            ''
        ];
        const toGeoPoint = trimConfig.create();

        values.forEach((val, ind) => {
            expect(toGeoPoint(val)).toEqual(expected[ind]);
        });
    });

    fit('can trim chars', () => {
        const values = [
            ' hello ',
            '   .*left',
            'right  .* ',
            '.*.*.*.*',
        ];
        const expected = [
            ' hello ',
            'left',
            'right  ',
            '',
        ];
        const toGeoPoint = trimConfig.create({ char: '.*' });

        values.forEach((val, ind) => {
            expect(toGeoPoint(val)).toEqual(expected[ind]);
        });
    });
});

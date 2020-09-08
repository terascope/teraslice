import { LATEST_VERSION } from '@terascope/data-types';
import 'jest-fixtures';
import { DataFrame } from '../src';

describe('DataFrame', () => {
    it('should be able to constructed without no data', () => {
        const dataFrame = DataFrame.fromJSON([], { version: LATEST_VERSION, fields: {} });
        expect(dataFrame).toBeInstanceOf(DataFrame);
        expect(dataFrame.columns).toBeArrayOfSize(0);
    });
});

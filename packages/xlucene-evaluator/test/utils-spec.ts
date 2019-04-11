import 'jest-extended';
import * as utils from '../src/utils';

describe('Utils', () => {
    it('should have GEO_DISTANCE_UNITS', () => {
        expect(utils.GEO_DISTANCE_UNITS).toBeObject();
    });
});

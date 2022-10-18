import 'jest-extended';
import { formatDailyTag } from '../src/helpers/publish/utils.js';

describe('Publish', () => {
    describe('->formatDailyTag', () => {
        it('should return a correctly formatted tag', async () => {
            const tag = await formatDailyTag();
            expect(tag).toMatch(/^daily-\d{4}.\d{2}.\d{2}-[A-Za-z0-9]{5,12}$/);
        });
    });
});

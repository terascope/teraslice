import 'jest-extended';
import { formatDailyTag, removeNodeSuffixFromTag } from '../src/helpers/publish/utils';

describe('Publish', () => {
    describe('->formatDailyTag', () => {
        it('should return a correctly formatted tag', async () => {
            const tag = await formatDailyTag();
            expect(tag).toMatch(/^daily-\d{4}.\d{2}.\d{2}-[A-Za-z0-9]{5,12}$/);
        });
    });

    describe('->removeNodeSuffixFromTag', () => {
        it('should return a tag without the node version', async () => {
            const tagBefore = 'v0.91.0-nodev18.18.2';
            const tagAfter = removeNodeSuffixFromTag(tagBefore);
            expect(tagAfter).toEqual('v0.91.0');
        });

        it('should not modify a tag without -nodev', async () => {
            const tagBefore = 'v0.91.0-v18.18.2';
            const tagAfter = removeNodeSuffixFromTag(tagBefore);
            expect(tagAfter).toEqual('v0.91.0-v18.18.2');
        });
    });
});

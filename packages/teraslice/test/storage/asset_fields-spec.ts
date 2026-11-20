import { AssetRecordSchema } from '@terascope/types';
import { ASSET_RECORD_FIELDS } from '../../src/lib/storage/assets.js';

describe('ASSET_RECORD_FIELDS', () => {
    it('does not include the blob', () => {
        expect(ASSET_RECORD_FIELDS).not.toContain('blob');
    });

    it('matches the v2 AssetRecordSchema, except the computed external_storage', () => {
        const schemaFields = Object.keys(AssetRecordSchema.shape)
            .filter((field) => field !== 'external_storage');

        expect([...ASSET_RECORD_FIELDS].sort()).toEqual(schemaFields.sort());
    });
});

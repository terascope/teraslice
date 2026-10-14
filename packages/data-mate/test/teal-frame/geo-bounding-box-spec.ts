import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    TealFrame, closeDuckDatabase, tealFrameAdapter, functionConfigRepository,
    FunctionDefinitionConfig
} from '../../src/index.js';

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: { location: { type: FieldType.GeoPoint } },
};

const RECORDS = [
    { location: { lat: 0.5, lon: 0.5 } },
    { location: { lat: 0.5, lon: 179.5 } },
    { location: null },
];

/**
 * An invalid box must fail on the SQL path the same way it fails in `DataFrame`, rather than
 * quietly matching nothing.
*/
describe('inGeoBoundingBox with an invalid box', () => {
    let frame: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'geo_box_src' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function run(args: Record<string, unknown>) {
        const result = await tealFrameAdapter(repo.inGeoBoundingBox, {
            field: 'location',
            inputConfig: { field_config: CONFIG.fields.location },
            args,
            preferSql: true,
        });
        const selected = frame.select({ location: result.expression }, {
            config: { version: 1, fields: { location: result.outputConfig.field_config } },
        });
        const out: unknown[] = [];
        for await (const row of selected.rows()) out.push(row.location);
        return { dispatch: result.dispatch, values: out };
    }

    it('should use SQL for a valid box', async () => {
        const { dispatch } = await run({ top_left: '1,0', bottom_right: '0,1' });
        expect(dispatch).toEqual('sql');
    });

    it('should throw for an inverted box instead of returning no matches', async () => {
        await expect(run({ top_left: '0,0', bottom_right: '1,1' }))
            .rejects.toThrow('top_left latitude (0) must be greater than bottom_right latitude (1)');
    });

    it('should throw for a box that crosses the antimeridian', async () => {
        await expect(run({ top_left: '1,179', bottom_right: '0,-179' }))
            .rejects.toThrow('top_left longitude (179) must be less than bottom_right longitude (-179)');
    });
});

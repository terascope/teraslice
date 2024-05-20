import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { generateRegistry } from '../../src/generators/registry';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('registry generator', () => {
    const JSTestAssetPath = path.join(dirname, '..', 'fixtures', 'testAsset');
    const TSTestAssetPath = path.join(dirname, '..', 'fixtures', 'testAssetTypescript');
    const JSRegistryPath = path.join(JSTestAssetPath, 'asset', 'index.js');
    const TSRegistryPath = path.join(TSTestAssetPath, 'asset', 'src', 'index.ts');

    afterAll(() => {
        fs.removeSync(path.join(dirname, '..', 'fixtures', 'testAsset', 'asset', 'index.js'));
        fs.removeSync(path.join(dirname, '..', 'fixtures', 'testAssetTypescript', 'asset', 'src', 'index.ts'));
    });

    it('should create an index.js in the testAsset dir', async () => {
        await generateRegistry(JSTestAssetPath);
        expect(fs.existsSync(JSRegistryPath)).toBe(true);
    });

    it('should create an index.js with correct object reference', () => {
        const indexContents = fs.readFileSync(JSRegistryPath, 'utf8');
        expect(indexContents).toInclude('Processor: require(\'./proc/processor.js\')');
        expect(indexContents).toInclude('Schema: require(\'./proc/schema.js\')');
        expect(indexContents).toInclude('Slicer: require(\'./proc/slicer.js\'),');
        expect(indexContents).toInclude('API: require(\'./proc2/api.js\'),');
        expect(indexContents).toInclude('Fetcher: require(\'./proc2/fetcher.js\'),');
        expect(indexContents).toInclude('Schema: require(\'./proc2/schema.js\'),');
    });

    it('should create an index.ts in a typescript asset repo', async () => {
        await generateRegistry(TSTestAssetPath);
        expect(fs.existsSync(TSRegistryPath)).toBe(true);
    });

    it('should create an index.ts with correct object reference', () => {
        const indexContents = fs.readFileSync(TSRegistryPath, 'utf8');
        expect(indexContents).toInclude('import Proc from \'../src/proc/processor\';');
        expect(indexContents).toInclude('import ProcSchema from \'../src/proc/schema\';');
        expect(indexContents).toInclude('import ProcSlicer from \'../src/proc/slicer\';');
        expect(indexContents).toInclude('import Proc2API from \'../src/proc2/api\';');
        expect(indexContents).toInclude('import Proc2Fetcher from \'../src/proc2/fetcher\';');
        expect(indexContents).toInclude('import Proc2Schema from \'../src/proc2/schema\';');
        expect(indexContents).toInclude('Processor: Proc,');
        expect(indexContents).toInclude('Schema: ProcSchema,');
        expect(indexContents).toInclude('Slicer: ProcSlicer,');
        expect(indexContents).toInclude('API: Proc2API,');
        expect(indexContents).toInclude('Fetcher: Proc2Fetcher,');
        expect(indexContents).toInclude('Schema: Proc2Schema,');
    });
});

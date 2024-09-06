import 'jest-extended';
import yargs from 'yargs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import registry from '../../../src/cmds/assets/registry.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('assets registry', () => {
    let yargsCmd: yargs.Argv<Record<string, any>>;
    beforeEach(() => {
        yargsCmd = yargs().command(
            // @ts-expect-error
            registry.command,
            registry.describe,
            registry.builder,
            () => true
        );
    });

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsResult = yargsCmd.parseSync(
                'registry', {}
            );

            expect(yargsResult._.includes('registry')).toBeTrue();
            expect(yargsResult.baseDir).toBeDefined();
        });
    });

    describe('-> handler', () => {
        const testAssetPath = path.join(dirname, '..', '..', 'fixtures', 'testAsset');
        const testAssetTypescriptPath = path.join(dirname, '..', '..', 'fixtures', 'testAssetTypescript');
        let registryPath: string;

        afterEach(() => {
            fs.rmSync(registryPath);
        });

        it('should create an index.js in the testAsset dir', async () => {
            registryPath = path.join(testAssetPath, 'asset', 'index.js');
            const { handler } = registry;
            const argv = yargsCmd.parseSync('registry');

            argv.registry = true;
            argv.baseDir = testAssetPath;

            await handler(argv);

            expect(fs.existsSync(registryPath)).toBe(true);
        });

        it('should create an index.ts in the testAssetTypescript dir', async () => {
            registryPath = path.join(testAssetTypescriptPath, 'asset', 'src', 'index.ts');
            const { handler } = registry;
            const argv = yargsCmd.parseSync('registry');

            argv.registry = true;
            argv.baseDir = testAssetTypescriptPath;

            await handler(argv);

            expect(fs.existsSync(registryPath)).toBe(true);
        });
    });
});

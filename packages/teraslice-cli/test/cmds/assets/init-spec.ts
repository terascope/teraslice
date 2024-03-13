import 'jest-extended';
import yargs from 'yargs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import os from 'os';
import assert from 'yeoman-assert';
// @ts-expect-error
import helpers from 'yeoman-test';
import init from '../../../src/cmds/assets/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('assets deploy', () => {
    let yargsCmd: yargs.Argv<Record<string, any>>;
    beforeEach(() => {
        yargsCmd = yargs.command(
            // @ts-expect-error
            init.command,
            init.describe,
            init.builder,
            () => true
        );
    });

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsResult = yargsCmd.parseSync(
                'init', {}
            );

            expect(yargsResult._.includes('init')).toBeTrue();
            expect(yargsResult.baseDir).toBeDefined();
        });

        it('should parse registry option', () => {
            const yargsResult = yargsCmd.parseSync(
                'init --registry'
            );

            expect(yargsResult.registry).toBeTrue();
        });

        it('should parse processor option', () => {
            const yargsResult = yargsCmd.parseSync(
                'init --processor'
            );

            expect(yargsResult.processor).toBeTrue();
        });
    });

    describe('-> handler', () => {
        const testAssetBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-new-asset'));
        const rootAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset');

        const deps = [
            [helpers.createDummyGenerator(), 'addExampleProcessor: app']
        ];

        beforeAll(() => helpers.run(path.join(__dirname, '..', '..', '..', 'src', 'generators', 'new-asset'))
            .inDir(testAssetBasePath)
            .withGenerators(deps)
            .withArguments(['generated-asset'])
            .withPrompts({
                name: 'new_asset',
                description: 'this is a new asset'
            }));

        afterAll(() => {
            fs.rmSync(testAssetBasePath, { recursive: true, force: true });
        });

        it('should create new asset from cmd', async () => {
            const { handler } = init;
            const argv = yargsCmd.parseSync('init');

            argv.registry = true;
            argv.baseDir = rootAssetPath;

            await handler(argv);

            assert.file([path.join(rootAssetPath, 'package.json')]);
        });
    });
});

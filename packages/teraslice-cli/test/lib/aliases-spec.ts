import 'jest-extended';
import path from 'path';
import fs from 'fs';
import { createTempDirSync } from 'jest-fixtures';

import Aliases from '../../src/helpers/aliases';

describe('Aliases', () => {
    let aliases: Aliases;

    beforeEach(() => {
        const tmpDir = createTempDirSync();
        aliases = new Aliases(path.join(tmpDir, 'aliases-test.yaml'));
    });

    afterEach(() => {
        // @ts-expect-error
        aliases = null;
    });

    describe('aliases', () => {
        test('should return a defined object', () => {
            expect(aliases).toBeDefined();
            expect(aliases.config).toBeDefined();
        });

        describe('-> add', () => {
            test('should add new alias to file', () => {
                aliases.add('test1', 'test1.net');
                const aliasesOutput = Aliases.readSync(aliases.aliasesFile);
                expect(fs.existsSync(aliases.aliasesFile)).toBeTruthy();
                expect(aliasesOutput.clusters.test1.host).toBe('test1.net');
            });

            test('should throw an error when existing alias added', () => {
                aliases.add('test1', 'test1.net');
                function aliasAdd() {
                    aliases.add('test1', 'test1.net');
                }
                expect(aliasAdd).toThrow('test1 already exists');
            });
        });

        describe('-> list', () => {
            test('should display txt table', () => {
                expect(aliases.list('txt')).toBe(undefined);
            });

            test('should display pretty table', () => {
                expect(aliases.list('pretty')).toBe(undefined);
            });
        });

        describe('-> present', () => {
            test('should return true if alias is present in file', () => {
                aliases.add('test1', 'test1.net');
                expect(aliases.present('test1')).toBeTruthy();
            });

            test('should return false if alias is not present in file', () => {
                aliases.add('test1', 'test1.net');
                expect(aliases.present('test2')).toBeFalsy();
            });
        });

        describe('-> remove', () => {
            test('should remove an alias from the file', () => {
                const tmpDir = createTempDirSync();
                const aliasesFile = path.join(tmpDir, 'aliases-test1.yaml');
                fs.copyFileSync(path.join(__dirname, '../fixtures', 'aliases-test1.yaml'), aliasesFile);
                aliases = new Aliases(aliasesFile);
                aliases.remove('test1');
                const aliasesOutput = Aliases.readSync(aliases.aliasesFile);

                expect(fs.existsSync(aliases.aliasesFile)).toBeTruthy();
                expect(aliasesOutput.clusters.test1).toBe(undefined);
                expect(aliasesOutput.clusters.localhost.host).toBe('http://localhost:5678');
            });

            test('should throw an error when existing alias added', () => {
                function aliasRemove() {
                    aliases.remove('test2');
                }
                expect(aliasRemove).toThrow('test2 not in aliases list');
            });
        });

        describe('-> update', () => {
            test('should update an alias from the file', () => {
                const tmpDir = createTempDirSync();
                const aliasesFile = path.join(tmpDir, 'aliases-test1.yaml');
                fs.copyFileSync(path.join(__dirname, '../fixtures', 'aliases-test1.yaml'), aliasesFile);
                aliases = new Aliases(aliasesFile);
                aliases.update('test1', 'http://test1.net:9999');
                const aliasesOutput = Aliases.readSync(aliases.aliasesFile);
                expect(aliasesOutput.clusters.test1.host).toBe('http://test1.net:9999');
            });

            test('should throw an error when updating a missing alias', () => {
                function aliasUpdate() {
                    aliases.update('test2', 'http://test2.net');
                }
                expect(aliasUpdate).toThrow('test2 not in aliases list');
            });
        });
    });
});

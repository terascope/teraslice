import { execFile, ExecFileException } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

interface ExecOutput {
    error: ExecFileException | null;
    stdout: string;
    stderr: string;
}
/// A lightweight aysnc execFile for fast testing
function execFileAsync(file: string, args: string[] = [], options = {}): Promise<ExecOutput> {
    return new Promise((resolve) => {
        execFile(file, args, options, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

describe('Bundled CLI Tests', () => {
    // Path to the bin file that imports the bundled js file
    const cliPath = path.resolve(__dirname, '../../bin/teraslice-cli.js');

    describe('-> teraslice-cli commands', () => {
        it('should display top level sub-commands', async () => {
            const result = await execFileAsync('node', [cliPath, '--help']);
            expect(result.error).toBeNull();
            expect(result.stdout).toContain('teraslice-cli.js <command>');
            expect(result.stderr).toBe('');
        });

        it('should display correct version from pkg.json', async () => {
            const packageJsonPath = path.join(__dirname, '../../package.json');
            const version = JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' })).version;
            const result = await execFileAsync('node', [cliPath, '--version']);
            expect(result.stdout).toContain(version);
        });

        it('should display aliases commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'aliases']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js aliases <command>');
        });

        it('should display assets commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'assets']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js assets <command>');
        });

        it('should display jobs commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'jobs']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js jobs');
            expect(result.stderr).toContain('commands to manage job');
        });

        it('should display ex commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'ex']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js ex <command>');
        });

        it('should display nodes commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'nodes']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js nodes <command>');
        });

        it('should display workers commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'workers']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js workers <command>');
        });

        it('should display controllers commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'controllers']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js controllers <command>');
        });

        it('should display tjm commands', async () => {
            const result = await execFileAsync('node', [cliPath, 'tjm']);
            expect(result.error?.code).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('teraslice-cli.js tjm <command>');
        });
    });

    describe('-> User error feedback', () => {
        describe('-> assets commands', () => {
            describe('-> registry', () => {
                it('should tell user directory is invalid', async () => {
                    const result = await execFileAsync('node', [cliPath, 'assets', 'registry']);
                    expect(result.error?.code).toBe(1);
                    expect(result.stdout).toBe('');
                    expect(result.stderr).toContain('is not a valid asset source directory.');
                });
            });
            describe('-> build', () => {
                it('should tell user directory is invalid', async () => {
                    const result = await execFileAsync('node', [cliPath, 'assets', 'build']);
                    expect(result.error?.code).toBe(1);
                    expect(result.stdout).toBe('');
                    expect(result.stderr).toContain('is not a valid asset source directory.');
                    expect(result.stderr).toContain('Error building asset');
                });
            });
        });
        describe('-> tjm commands', () => {
            describe('-> register', () => {
                it('should tell user no jobfile was found', async () => {
                    const result = await execFileAsync('node', [cliPath, 'tjm', 'register', 'localhost', 'non-file3.json']);
                    expect(result.error?.code).toBe(1);
                    expect(result.stdout).toBe('');
                    expect(result.stderr).toContain('check your path and file name and try again');
                    expect(result.stderr).toContain('Cannot find');
                });
            });
        });
    });
});

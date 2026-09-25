/* eslint-disable no-console */
// This file's output IS its product: it runs as an image build step and reports to whoever
// reads the build log. There is no logger to route through.
import { parseArgs } from 'node:util';
import { ExtensionReport, installExtensions, verifyExtensions } from './extension-tools.js';

const USAGE = `usage: duckdb-extensions <install|verify> [--dir <directory>] [--repository <url|dir>]

  install   download the extensions DuckFrame needs into --dir (image BUILDER stage)
  verify    prove they load and work with no network (image RUNTIME stage)

  --dir         defaults to $DUCKDB_EXTENSION_DIRECTORY, then ~/.duckdb/extensions
  --repository  install only: an internal mirror, laid out as
                <repository>/<duckdb version>/<platform>/<name>.duckdb_extension.gz

Exits non-zero on any failure, so a build step running it fails the build.`;

async function main(): Promise<number> {
    const { positionals, values } = parseArgs({
        allowPositionals: true,
        options: {
            dir: { type: 'string' },
            repository: { type: 'string' },
            help: { type: 'boolean', short: 'h' },
        },
    });
    const [command] = positionals;

    if (values.help || (command !== 'install' && command !== 'verify') || positionals.length > 1) {
        console.error(USAGE);
        return values.help ? 0 : 2;
    }
    if (command === 'verify' && values.repository != null) {
        console.error('--repository applies to install only; verify never uses the network');
        return 2;
    }

    const report = command === 'install'
        ? await installExtensions({ directory: values.dir, repository: values.repository })
        : await verifyExtensions({ directory: values.dir });

    return print(command, report);
}

function print(command: string, report: ExtensionReport): number {
    const where = `duckdb ${report.version} on ${report.platform}, ${report.directory}`;

    if (report.failures.length > 0) {
        console.error(`duckdb-extensions ${command} FAILED (${where}):`);
        for (const failure of report.failures) console.error(`  ${failure}`);
        return 1;
    }
    console.log(`duckdb-extensions ${command} ok (${where})`);
    return 0;
}

main().then(
    (code) => {
        process.exitCode = code;
    },
    (err: unknown) => {
        console.error('duckdb-extensions failed:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    }
);

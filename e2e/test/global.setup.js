import ms from 'ms';
import { castArray, pDelay } from '@terascope/utils';
import fse from 'fs-extra';
import signale from './signale.js';
import { waitForClusterState, waitForExStatus } from './wait.js';
import setupTerasliceConfig from './setup-config.js';
import downloadAssets from './download-assets.js';
import { resetState } from './helpers.js';
import misc from './misc.js';

const { GENERATE_ONLY } = process.env;
const generateOnly = GENERATE_ONLY ? parseInt(GENERATE_ONLY, 10) : null;

function getElapsed(time) {
    const elapsed = Date.now() - time;
    return `took ${ms(elapsed)}`;
}

async function dockerUp() {
    const startTime = Date.now();
    signale.pending('Bringing Docker environment up...');

    await misc.compose.up({
        'force-recreate': ''
    });
    signale.success('Docker environment is good to go', getElapsed(startTime));
}

function waitForTeraslice() {
    const startTime = Date.now();
    signale.pending('Waiting for Teraslice...');

    return waitForClusterState().then((nodes) => {
        signale.success(`Teraslice is ready to go with ${nodes} nodes`, getElapsed(startTime));
    });
}

async function generateTestData() {
    const startTime = Date.now();
    signale.pending('Generating example data...');

    async function postJob(jobSpec) {
        const ex = await misc
            .teraslice()
            .executions.submit(jobSpec);
        return ex;
    }

    async function generate(count, hex) {
        if (generateOnly && generateOnly !== count) return;

        const genStartTime = Date.now();
        let indexName = misc.getExampleIndex(count);
        if (hex) {
            indexName += '-hex';
        }

        signale.info(`Generating ${indexName} example data`);
        const jobSpec = {
            name: `Generate: ${indexName}`,
            lifecycle: 'once',
            workers: 1,
            assets: ['elasticsearch', 'standard'],
            operations: [
                {
                    _op: 'data_generator',
                    size: count
                },
                {
                    _op: 'elasticsearch_bulk',
                    index: indexName,
                    type: 'events',
                    size: 1000
                }
            ]
        };

        try {
            if (hex) {
                jobSpec.operations[0].size = count / hex.length;
                jobSpec.operations[0].set_id = 'hexadecimal';
                jobSpec.operations[1].id_field = 'id';
                const result = await Promise.all(hex.map((letter) => {
                    jobSpec.name = `Generate: ${indexName}[${letter}]`;
                    jobSpec.operations[0].id_start_key = letter;
                    return postJob(jobSpec);
                }));
                const executions = castArray(result);
                await Promise.all(executions.map((ex) => waitForExStatus(ex, 'completed')));
            } else {
                await postJob(jobSpec);
            }

            signale.info(`Generated ${indexName} example data`, getElapsed(genStartTime));
        } catch (err) {
            signale.error(`Failure to generate example data ${indexName}`, err);
            throw err;
        }
    }

    try {
        await Promise.all(misc.EXAMPLE_INDEX_SIZES.map((size) => generate(size)));
        // we need fully active jobs so we can get proper meta data for recovery state tests
        signale.success('Data generation is done', getElapsed(startTime));
    } catch (err) {
        signale.error('Data generation failed', getElapsed(startTime));
        throw err;
    }
}

module.exports = async () => {
    await misc.globalTeardown();
    await misc.resetLogs();

    process.stdout.write('\n');
    signale.time('global setup');

    if (!fse.existsSync(misc.CONFIG_PATH)) {
        await fse.emptyDir(misc.CONFIG_PATH);
    }
    if (!fse.existsSync(misc.ASSETS_PATH)) {
        await fse.emptyDir(misc.ASSETS_PATH);
    }

    await Promise.all([
        fse.ensureDir(misc.ASSETS_PATH),
        fse.ensureDir(misc.CONFIG_PATH),
    ]);

    await Promise.all([setupTerasliceConfig(), downloadAssets()]);

    await dockerUp();
    await waitForTeraslice();
    await pDelay(2000);
    await resetState();

    try {
        await generateTestData();
    } catch (err) {
        signale.error('Setup failed, `docker-compose logs` may provide clues');
        signale.error(err);
        process.exit(1);
    }

    signale.timeEnd('global setup');
};

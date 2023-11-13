import execa from 'execa';
import { debugLogger, pDelay } from '@terascope/utils';
import {
    createKindCluster,
    createNamespace,
    deployK8sTeraslice,
    isKindInstalled,
    isKubectlInstalled,
    kindLoadServiceImage,
    kindStartService,
    kindStopService,
    setAliasAndBaseAssets
} from '../scripts';
import { k8sEnvOptions } from './interfaces';
import signale from '../signale';

// import { TerasliceHarness } from 'e2e/test/teraslice-harness.js';
// const TerasliceHarness = require('e2e/test/teraslice-harness');

const logger = debugLogger('ts-scripts:cmd:k8s-env');

export async function launchK8sEnv(options: k8sEnvOptions) {
    logger.info('Starting k8s environment with the following options: ', options);

    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    await createKindCluster();
    await createNamespace('services-ns.yaml');

    // FIXME: launch services
    const services = ['elasticsearch', 'kafka'];
    // Promise.all([])
    for (const service of services) {
        await kindStopService(service);
        // await kindLoadServiceImage(service, services[service].image, version);
        await kindStartService(service);
    }

    // const teraslice = new TerasliceHarness();
    // await teraslice.init();
    await deployK8sTeraslice();

    // FIXME: we need an alternative to teraslice harness?
    // await teraslice.waitForTeraslice();
    await waitForTerasliceRunning(120000);
    await setAliasAndBaseAssets('127.0.0.1');
}

function waitForTerasliceRunning(timeoutMs = 120000) : Promise<boolean> {
    const endAt = Date.now() + timeoutMs;

    const _waitForTerasliceRunning = async () : Promise<boolean> => {
        if (Date.now() > endAt) {
            throw new Error(`Failure to communicate with the Teraslice Master after ${timeoutMs}ms`);
        }

        let terasliceRunning = false;
        // let nodes = -1;
        try {
            const TSMasterResponse = execa.command('curl localhost:5678').stdout;
            if (TSMasterResponse) {
                TSMasterResponse.on('data', (data) => {
                    const jsonData = JSON.parse(data);
                    signale.info(`response: ${JSON.stringify(jsonData)}`);
                    if (jsonData.clustering_type === 'kubernetes') {
                        signale.info('jsonData.clusteringType === kubernetes');
                        terasliceRunning = true;
                    }
                });
            }
        } catch (err) {
            await pDelay(3000);
            return _waitForTerasliceRunning();
        }

        if (terasliceRunning) return true;
        return _waitForTerasliceRunning();
    };

    return _waitForTerasliceRunning();
}

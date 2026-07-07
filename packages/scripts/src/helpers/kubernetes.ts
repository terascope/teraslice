import { execaCommand } from 'execa';
import { debugLogger, TSError, pDelay } from '@terascope/core-utils';
import config from './config.js';
import signale from './signale.js';
import { ServiceObj } from './interfaces.js';

const logger = debugLogger('ts-scripts:cmd');

export async function isKindInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v kind');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isKubectlInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v kubectl');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isHelmInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v helm');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isHelmfileInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v helmfile');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function waitForKafkaRunning(name: string, timeoutMs = 12000): Promise<void> {
    const endAt = Date.now() + timeoutMs;

    const _waitForKafkaRunning = async (): Promise<void> => {
        if (Date.now() > endAt) {
            if (logger.level() <= 20) {
                try {
                    const errorSearchCommand = await execaCommand(`kubectl -n services-dev1 logs -l app.kubernetes.io/name=${name}`);
                    logger.debug('Kafka pod logs:');
                    logger.debug(errorSearchCommand.stdout);
                } catch (err) {
                    logger.error(err, 'Failure to retrieve kafka pod logs');
                    const describePodCommand = await execaCommand(`kubectl -n services-dev1 describe pods -l app.kubernetes.io/name=${name}`);
                    logger.debug('Describe kafka pod:');
                    logger.debug(describePodCommand.stdout);
                }
            }
            throw new Error(`Failure to communicate with kafka after ${timeoutMs}ms`);
        }

        let kafkaRunning = false;
        try {
            const kubectlResponse = await execaCommand(`kubectl -n services-dev1 get pods -l app.kubernetes.io/name=${name} -o=jsonpath="{.items[?(@.status.containerStatuses)].status.containerStatuses[0].ready}"`);
            const kafkaReady = kubectlResponse.stdout;
            logger.debug('Kafka ready: ', kafkaReady);
            if (kafkaReady === '"true"') {
                kafkaRunning = true;
            }
        } catch (err) {
            await pDelay(3000);
            return _waitForKafkaRunning();
        }

        if (kafkaRunning) {
            return;
        }
        await pDelay(3000);
        return _waitForKafkaRunning();
    };

    return _waitForKafkaRunning();
}

export async function setAlias(tsPort: number) {
    try {
        const subprocess1 = await execaCommand('earl aliases remove k8s-e2e 2> /dev/null || true', { shell: true });
        logger.debug(subprocess1.stdout);
        if (subprocess1.stderr) {
            throw new Error(subprocess1.stderr);
        }

        const subprocess2 = await execaCommand(`earl aliases add k8s-e2e http://${config.HOST_IP}:${tsPort}`);
        logger.debug(subprocess2.stdout);
        if (subprocess2.stderr) {
            throw new Error(subprocess2.stderr);
        }
    } catch (err) {
        throw new Error(`Failed to set alias: ${err}`);
    }
}

export async function showState(tsPort: number, isTeardown: boolean = false) {
    try {
        if (isTeardown) {
            logger.debug('=== k8s cluster state ===');
            const clusterState = await execaCommand('kubectl get deployments,po,svc --all-namespaces --show-labels -o wide');
            logger.debug(clusterState.stdout);

            logger.debug('=== docker stats ===');
            const dockerStats = await execaCommand('docker stats --no-stream');
            logger.debug(dockerStats.stdout);

            logger.debug('=== opensearch2 pod description ===');
            const searchHost = await determineSearchHost();
            const os2Desc = await execaCommand(`kubectl -n services-dev1 describe pod ${searchHost}-cluster-master-0`);
            logger.debug(os2Desc.stdout);

            // TODO: consider adding describe for kafka and minio pods
        }

        const subprocess = await execaCommand('kubectl get deployments,po,svc --all-namespaces --show-labels -o wide');
        logger.debug(subprocess.stdout);
        logger.debug(await showESIndices());
        logger.debug(await showAssets(tsPort));
    } catch (err) {
        signale.error(`Failed to get k8s resources: ${err}`);
    }
}

async function showESIndices() {
    const subprocess = await execaCommand(`curl -k ${config.SEARCH_TEST_HOST}/_cat/indices?v`);
    return subprocess.stdout;
}

async function showAssets(tsPort: number) {
    try {
        const subprocess = await execaCommand(`curl ${config.HOST_IP}:${tsPort}/v1/assets`);
        return subprocess.stdout;
    } catch (err) {
        return err;
    }
}

export async function logTCPPorts(service: string) {
    try {
        const command = 'netstat -an | grep \'^tcp\' | awk \'{print $4}\' | tr ".:" " " | awk \'{print $NF}\' | sort -n | uniq | tr "\n" " "';
        const subprocess = await execaCommand(command, { shell: true, reject: false });
        const { stdout, stderr } = subprocess;

        if (stderr) {
            throw new Error(stderr);
        }
        signale.info(`TCP Ports currently in use when starting ${service}:\n ${stdout}`);
    } catch (err) {
        signale.error(`Execa command failed trying to log ports: ${err}`);
    }
}

export async function deletePersistentVolumeClaim(searchHost: string) {
    try {
        const label = searchHost.includes('opensearch') ? `app.kubernetes.io/instance=${searchHost}` : `app=${searchHost}-master`;
        const subprocess = await execaCommand(`kubectl delete -n services-dev1 pvc -l ${label}`);

        logger.debug(`kubectl delete pvc: ${subprocess.stdout}`);
    } catch (err) {
        throw new TSError(`Failed to delete persistent volume claim:\n${err}`);
    }
}

export async function determineSearchHost() {
    const possible = ['opensearch1', 'opensearch2', 'opensearch3'];
    const subprocess = await execaCommand('helm list -n services-dev1 -o json');

    logger.debug(`helmfile list:\n${subprocess.stdout}`);

    const serviceList: Array<ServiceObj> = JSON.parse(subprocess.stdout);
    const filtered = serviceList.filter((svc: ServiceObj) => possible.includes(svc.name));

    if (filtered.length > 1) {
        throw new TSError('Multiple Possible Search Hosts Detected. Cannot reset store.');
    }
    if (filtered.length === 0) {
        throw new TSError('No Search Host Detected. Cannot reset store.');
    }

    return filtered[0].name;
}

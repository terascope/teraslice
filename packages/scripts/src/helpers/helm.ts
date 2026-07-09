import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execaCommand } from 'execa';
import { load } from 'js-yaml';
import { parseDocument } from 'yaml';
import { debugLogger, isCI, TSError } from '@terascope/core-utils';
import { Service } from '@terascope/types';
import config from './config.js';
import signale from './signale.js';
import { getRootDir, getRootInfo } from './misc.js';
import { getVolumesFromDockerfile } from './kind.js';
import { readCertFromPath, getAdminDnFromCert } from './certs.js';
import { waitForKafkaRunning } from './kubernetes.js';
import { grabCurrentTSNodeVersion } from './docker.js';

const logger = debugLogger('ts-scripts:cmd');

export async function helmfileDestroy(selector: string) {
    const helmfilePath = path.join(getRootDir(), 'packages/scripts/helm/helmfile.yaml.gotmpl');

    try {
        const subprocess = await execaCommand(`helmfile destroy -f ${helmfilePath} --selector app=${selector}`);
        logger.debug(`helmfile destroy:\n${subprocess.stdout}`);
    } catch (err) {
        logger.info(err);
    }
}

export async function helmfileCommand(
    command: string,
    clusteringType: 'kubernetesV2',
    devMode = false,
    logs = false,
    e2e = true
) {
    const helmfilePath = path.join(getRootDir(), 'packages/scripts/helm/helmfile.yaml.gotmpl');
    const { valuesPath, valuesDir } = generateHelmValuesFromServices(
        clusteringType, devMode, logs, e2e
    );

    let subprocess;
    try {
        subprocess = await execaCommand(`helmfile --state-values-file ${valuesPath} ${command} -f ${helmfilePath}`);
    } catch (err) {
        // TSError truncates to 3000 characters which is an issue here
        throw new Error(`Helmfile ${command} command failed:\n${err}`);
    } finally {
        fs.rmSync(valuesDir, { recursive: true, force: true });
    }

    logger.debug(`helmfile ${command}:\n${subprocess.stdout}`);
}

export async function launchTerasliceWithHelmfile(
    clusteringType: 'kubernetesV2',
    devMode = false,
    logs = false,
    debug = false,
    e2e = true
) {
    if (debug && !isCI) {
        await helmfileCommand('diff', clusteringType, devMode, logs, e2e);
    }
    await helmfileCommand('sync', clusteringType, devMode, logs, e2e);

    if (config.ENV_SERVICES.includes(Service.Kafka)) {
        await waitForKafkaRunning('kafka');
    }
}

export async function launchTerasliceWithCustomHelmfile(
    configFilePath: string,
    debug: boolean = false,
    selector?: { diff: string; sync: string },
) {
    let diffProcess;
    let syncProcess;
    const diffSelector = selector && selector.diff ? `-l group!=skipDiff,${selector.diff}` : '-l group!=skipDiff';
    const syncSelector = selector && selector.sync ? `-l ${selector.sync}` : '';
    const helmfilePath = path.join(getRootDir(), 'packages/scripts/helm/helmfile.yaml.gotmpl');

    try {
        if (debug && !isCI) {
            // We want to exclude certain charts from the diff command because
            //  they may require crds that aren't installed
            diffProcess = await execaCommand(`helmfile ${diffSelector} --state-values-file ${configFilePath} diff -f ${helmfilePath}`);
            logger.debug(`helmfile diff:\n${diffProcess.stdout}`);
        }
        syncProcess = await execaCommand(`helmfile ${syncSelector} --state-values-file ${configFilePath} sync -f ${helmfilePath}`);
        logger.debug(`helmfile sync:\n${syncProcess.stdout}`);
    } catch (err) {
        // TSError truncates to 3000 characters which is an issue here
        throw new Error(`Helmfile command failed:\n${err}`);
    }
}

/**
 * Gets the current version of the Teraslice Helm chart from `Chart.yaml`.
 *
 * @throws {Error} If the `Chart.yaml` file cannot be read
 * @returns {Promise<string>} Resolves with the Helm chart version as a string
 */
export async function getCurrentHelmChartVersion(): Promise<string> {
    const chartYamlPath = path.join(getRootDir(), '/helm/teraslice/Chart.yaml');
    const chartYAML = await load(fs.readFileSync(chartYamlPath, 'utf8')) as any;
    return chartYAML.version as string;
}

// Move to misc.ts if this is ever needed outside of helm.ts
function getTerasliceVersion() {
    const rootPackageInfo = getRootInfo();
    return rootPackageInfo.version;
}

/**
 * Updates the Teraslice Helm chart YAML files (`Chart.yaml` and `values.yaml`)
 * with the new chart version
 *
 * @param {string | null} newChartVersion - The new version to set in `Chart.yaml`.
 *    - If `null`, the function does not update the chart version.
 * @throws {TSError} If the function fails to read or write YAML files.
 * @returns {Promise<void>} Resolves when the Helm chart files have been successfully updated
 */
export async function updateHelmChart(newChartVersion: string | null): Promise<void> {
    const currentNodeVersion = await grabCurrentTSNodeVersion();
    const rootDir = getRootDir();
    const chartYamlPath = path.join(rootDir, 'helm/teraslice/Chart.yaml');
    const valuesYamlPath = path.join(rootDir, 'helm/teraslice/values.yaml');

    try {
        // Read YAML files and parse them into objects
        const chartFileContent = fs.readFileSync(chartYamlPath, 'utf8');
        const valuesFileContent = fs.readFileSync(valuesYamlPath, 'utf8');

        const chartDoc = parseDocument(chartFileContent);
        const valuesDoc = parseDocument(valuesFileContent);

        // Update specific values for the chart
        if (newChartVersion) {
            chartDoc.set('version', newChartVersion);
        }
        chartDoc.set('appVersion', `v${getTerasliceVersion()}`);
        valuesDoc.setIn(['image', 'nodeVersion'], `v${currentNodeVersion}`);

        // Write the updated YAML back to the files
        fs.writeFileSync(chartYamlPath, chartDoc.toString(), 'utf8');
        fs.writeFileSync(valuesYamlPath, valuesDoc.toString(), 'utf8');
    } catch (err) {
        throw new TSError(`Unable to read or write Helm chart YAML files:\n${err}`);
    }
}

/**
 * Generates a temporary `values.yaml` file based on the ts-scripts command configuration.
 * This file is used to configure Helmfile when launching the k8sEnv or test environment.
 *
 * The function:
 * - Loads a base `values.yaml` template from `packages/scripts/helm/values.yaml`.
 * - Enables services specified in `ENV_SERVICES`, setting their versions when needed
 * - Configures OpenSearch to align with versioning conventions.
 * - Handles OpenSearch, Minio and Kafka SSL settings if encryption is enabled.
 * - Adds extraVolumes, extraVolumeMounts and env values if running in dev mode.
 * - Generates a temporary directory to store the modified `values.yaml`.
 *
 * @param { 'kubernetesV2' } clusteringType - backend cluster manager type
 * @param { boolean } devMode - Mount local teraslice to k8s resources for faster development.
 * @param { boolean } logs - Copy teraslice and service logs from k8s pods to local filesystem.
 * @param { boolean } e2e - Specify e2e tests or k8s env mode.
 * @returns An object containing:
 * - `valuesPath` - Path to the generated `values.yaml` file.
 * - `valuesDir` - Path to the temporary directory containing the file.
 */
function generateHelmValuesFromServices(
    clusteringType: 'kubernetesV2',
    devMode: boolean,
    logs: boolean,
    e2e: boolean
): { valuesPath: string; valuesDir: string } {
    // Grab default values from the packages/scripts/helm/values.yaml
    const helmfileValuesPath = path.join(getRootDir(), 'packages/scripts/helm/values.yaml');
    const values = parseDocument(fs.readFileSync(helmfileValuesPath, 'utf8'));

    // Map services to versions used for the image tag
    const versionMap: Record<Service, string> = {
        [Service.Opensearch]: config.OPENSEARCH_VERSION,
        [Service.Kafka]: config.KAFKA_VERSION,
        [Service.Minio]: config.MINIO_VERSION,
        [Service.RabbitMQ]: config.RABBITMQ_VERSION,
        [Service.RestrainedOpensearch]: config.OPENSEARCH_VERSION,
        [Service.Utility]: config.UTILITY_SVC_VERSION,
        [Service.Valkey]: config.VALKEY_VERSION,
        [Service.Teraslice]: config.TERASLICE_DOCKER_IMAGE,
    };

    let stateCluster: string | undefined;
    let caCert: string | undefined;

    // disable chart's OS2 default
    values.setIn(['opensearch2', 'enabled'], false);

    // Iterate over each service we want to start and enable them in the
    // helmfile.
    config.ENV_SERVICES.forEach((service: Service) => {
        // "serviceString" represents the literal service name string
        // in the "values.yaml"
        let serviceString: string = service;
        const version = versionMap[service];

        if (service === Service.Opensearch) {
            const major = config.OPENSEARCH_VERSION.charAt(0);
            serviceString += major;
            // This assumes there is only one search service enabled. If both ES and OS services
            // are present the state cluster will be set to elasticsearch below.
            stateCluster = serviceString;

            if (config.ENCRYPT_OPENSEARCH) {
                if (major === '1') {
                    throw new TSError('Encrypted Opensearch version 1 is not enabled. Please use OS2 or OS3.');
                }
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                const admin_dn = getAdminDnFromCert();
                values.setIn([serviceString, 'ssl', 'enabled'], true);
                values.setIn([serviceString, 'ssl', 'caCert'], caCert);
                values.setIn([serviceString, 'ssl', 'admin_dn'], admin_dn);
            }
        }

        if (service === Service.Kafka) {
            if (config.ENCRYPT_KAFKA) {
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                values.setIn(['kafka', 'ssl', 'enabled'], true);
                values.setIn(['kafka', 'ssl', 'caCert'], caCert);
            }

            // Listener settings go into configurationOverrides (dotted Kafka key format) so the
            // chart's brokerConfigs helper merges them with internal defaults without creating
            // duplicate env vars. Values come from config.ts which sets k8s-appropriate defaults
            // based on TEST_PLATFORM and ENCRYPT_KAFKA. If you add new listener settings, add
            // them to config.ts and include them in this object.
            const kafkaK8sConfigOverrides: Record<string, string> = {
                'advertised.listeners': config.KAFKA_ADVERTISED_LISTENERS,
                'listener.security.protocol.map': config.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP,
                listeners: config.KAFKA_LISTENERS,
            };
            if (config.ENCRYPT_KAFKA) {
                // PLAINTEXT is the inter-broker listener in the SSL setup: brokers talk to each
                // other on the internal PLAINTEXT listener while clients connect via TLS.
                kafkaK8sConfigOverrides['inter.broker.listener.name'] = 'PLAINTEXT';
                kafkaK8sConfigOverrides['security.protocol'] = config.KAFKA_SECURITY_PROTOCOL.toLowerCase();
            }
            values.setIn(['kafka', 'configurationOverrides'], kafkaK8sConfigOverrides);

            // Only behavioral vars belong in envOverrides — the chart does not generate these
            // internally so there is no duplicate risk.
            // If you add a new Kafka env var to config.ts and services.ts, add it here too.
            values.setIn(['kafka', 'envOverrides', 'KAFKA_AUTO_CREATE_TOPICS_ENABLE'], config.KAFKA_AUTO_CREATE_TOPICS_ENABLE);
            values.setIn(['kafka', 'envOverrides', 'KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR'], config.KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR);
            values.setIn(['kafka', 'envOverrides', 'KAFKA_TRANSACTION_STATE_LOG_MIN_ISR'], config.KAFKA_TRANSACTION_STATE_LOG_MIN_ISR);
            values.setIn(['kafka', 'envOverrides', 'KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS'], config.KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS);
        }

        if (service === Service.Minio) {
            if (config.ENCRYPT_MINIO) {
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                const publicCert = readCertFromPath(path.join(config.CERT_PATH, 'public.crt')).replace(/\n/g, '\\n');
                const privateKey = readCertFromPath(path.join(config.CERT_PATH, 'private.key')).replace(/\n/g, '\\n');

                values.setIn(['minio', 'tls', 'enabled'], true);
                values.setIn(['minio', 'tls', 'caCert'], caCert);
                values.setIn(['minio', 'tls', 'publicCert'], publicCert);
                values.setIn(['minio', 'tls', 'privateKey'], privateKey);
                values.setIn(['minio', 'tls', 'certSecret'], 'tls-ssl-minio');
            }
        }

        if (service === Service.Valkey) {
            if (config.ENCRYPT_VALKEY) {
                throw new Error('Valkey encryption not supported');
            }
        }

        values.setIn([serviceString, 'enabled'], true);
        values.setIn([serviceString, 'version'], version);
    });

    // If no search service specified then default to OS2
    if (!stateCluster) {
        stateCluster = 'opensearch2';
        values.setIn(['opensearch2', 'enabled'], true);
    }
    values.setIn(['teraslice', 'stateCluster'], stateCluster);

    values.setIn(['teraslice', 'image', 'tag'], `e2e-nodev${config.NODE_VERSION}`);
    values.setIn(['teraslice', 'asset_storage_connection_type'], config.ASSET_STORAGE_CONNECTION_TYPE);
    values.setIn(['teraslice', 'asset_storage_connection'], config.ASSET_STORAGE_CONNECTION);
    values.setIn(['teraslice', 'cluster_manager_type'], clusteringType);
    values.setIn(['teraslice', 'name'], config.CLUSTER_NAME);
    values.setIn(['teraslice', 'assets_directory'], e2e ? '/app/e2e-assets' : '/app/assets');
    values.setIn(['teraslice', 'e2e'], e2e);

    if (devMode) {
        // Dev image runs as root and writes/compiles into the bind-mounted source at
        // runtime, so the chart's hardened securityContext won't work. Override the
        // blocking fields back to permissive (explicit values, since Helm deep-merges
        // and an empty {} would leave the hardened defaults in place).
        values.setIn(['teraslice', 'securityContext'], {
            runAsUser: 0,
            runAsNonRoot: false,
            readOnlyRootFilesystem: false
        });

        const dockerfileMounts = getVolumesFromDockerfile(false, logger);

        // Shared node_modules volume: lives on the Kind node
        // mounted into all pods so only the master runs pnpm install once.
        dockerfileMounts.volumes.push({
            name: 'dev-node-modules',
            hostPath: { path: '/dev-node-modules', type: 'DirectoryOrCreate' }
        });
        dockerfileMounts.volumeMounts.push({
            name: 'dev-node-modules',
            mountPath: '/app/source/node_modules'
        });

        values.setIn(['teraslice', 'extraVolumeMounts'], dockerfileMounts.volumeMounts);
        values.setIn(['teraslice', 'extraVolumes'], dockerfileMounts.volumes);

        /// Pass in env so master passes volumes to ex's and workers
        values.setIn(['teraslice', 'env'], {
            MOUNT_LOCAL_TERASLICE: Buffer.from(JSON.stringify(dockerfileMounts)).toString('base64')
        });
    }

    if (logs) {
        values.setIn(['stern', 'enabled'], true);
        const arch = os.arch() === 'x64' ? 'amd64' : 'arm64';
        const sternVersion = '1.30.0';
        values.setIn(
            ['stern', 'downloadUrl'],
            `https://github.com/stern/stern/releases/download/v${sternVersion}/stern_${sternVersion}_linux_${arch}.tar.gz`
        );
    }

    signale.debug('helmfile command values: ', JSON.stringify(values));

    // Write the values to a temporary file
    const valuesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-yaml'));
    const valuesPath = path.join(valuesDir, 'values.yaml');
    fs.writeFileSync(valuesPath, values.toString(), 'utf8');
    return { valuesPath, valuesDir };
}

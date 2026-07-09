import fs from 'node:fs';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';
import { execa } from 'execa';
import fse from 'fs-extra';
import { TSError } from '@terascope/core-utils';
import config from './config.js';
import signale from './signale.js';

// Helper function for reading the contents of a certificate by providing its path
export function readCertFromPath(certPath: string): string {
    if (!fs.existsSync(certPath)) {
        throw new TSError(`Unable to find cert at: ${certPath}`);
    }

    return fs.readFileSync(certPath, 'utf8');
}

/**
 * Extracts the admin distinguished name (DN) from a certificate.
 *
 * This function is designed specifically for mkcert generated certificates.
 * It reads the certificate file (`opensearch-cert.pem`), extracts the `O`
 * and `OU` fields from the subject, and formats them
 * in the required order (`OU` first, `O` second) for OpenSearch authentication.
 *
 * @returns {string} The formatted (DN) string in the format:
 * `"OU=example, O=example"`
 * @throws {Error} If the certificate file is missing or invalid.
 *
 * @example
 * ```ts
 * const adminDn = getAdminDnFromCert();
 * console.log(adminDn);
 * // Output: "OU=anon@anon-MBP (Anon User),O=mkcert development certificate"
 * ```
 */
export function getAdminDnFromCert(): string {
    let ca: string;
    let organization: string | undefined;
    let organizationalUnit: string | undefined;

    try {
        ca = readCertFromPath(path.join(config.CERT_PATH, 'opensearch-cert.pem'));
    } catch (err) {
        throw new TSError(`Failed to read certificate file (opensearch-cert.pem).\n${err}`);
    }
    try {
        const rootCA = new X509Certificate(ca);
        // This splits the OU and O in two separate parts
        const subjectParts = rootCA.subject.split('\n');

        // Loop through the parts and assign based on prefix
        // We don't want to assume the order that these are returned
        for (const part of subjectParts) {
            if (part.startsWith('OU=')) {
                organizationalUnit = part;
            } else if (part.startsWith('O=')) {
                organization = part;
            }
        }
    } catch (err) {
        throw new TSError(`Failed to parse openSearch certificate. Make sure it's a valid X.509 certificate.\n${err}`);
    }

    if (!organizationalUnit || !organization) {
        throw new TSError(`Certificate is missing required fields. Expected both 'OU' and 'O' fields.`);
    }
    // Return with specific format that opensearch expects
    return `${organizationalUnit},${organization}`;
}

/**
 * Writes the Opensearch internal_users.yml file with demo user credentials
 * to the specified certificate directory. This file is required by Opensearch
 * security configuration to define local user accounts.
 *
 * @param certDir - Absolute path to the directory where the file will be written
 */
function createInternalUsersFile(certDir: string): void {
    const content = `# This is the internal user database
# The hash value is a bcrypt hash and can be generated with plugin/tools/hash.sh

_meta:
  type: "internalusers"
  config_version: 2

# Define your internal users here

## Demo users
# This hash password is passwordsufhbivbU123%$
admin:
  hash: "$2y$12$Z234bambHnVJMAXiccuMluNgGhNNdOFIY6pFT2/lk3ZC.RDoDIFme"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
anomalyadmin:
  hash: "$2y$12$TRwAAJgnNo67w3rVUz4FIeLx9Dy/llB79zf9I15CKJ9vkM4ZzAd3."
  reserved: false
  opendistro_security_roles:
  - "anomaly_full_access"
  description: "Demo anomaly admin user, using internal role"
kibanaserver:
  hash: "$2a$12$4AcgAt3xwOWadA5s5blL6ev39OXDNhmOesEoo33eZtrq2N0YrU3H."
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "$2a$12$JJSXNfTowz7Uu5ttXfeYpeYE0arACvcwlPBStB1F.MI7f0U9Z4DGC"
  reserved: false
  backend_roles:
  - "kibanauser"
  - "readall"
  attributes:
    attribute1: "value1"
    attribute2: "value2"
    attribute3: "value3"
  description: "Demo OpenSearch Dashboards read only user, using external role mapping"
logstash:
  hash: "$2a$12$u1ShR4l4uBS3Uv59Pa2y5.1uQuZBrZtmNfqB3iM/.jL0XoV9sghS2"
  reserved: false
  backend_roles:
  - "logstash"
  description: "Demo logstash user, using external role mapping"
readall:
  hash: "$2a$12$ae4ycwzwvLtZxwZ82RmiEunBbIPiAmGZduBAjKN0TXdwQFtCwARz2"
  reserved: false
  backend_roles:
  - "readall"
  description: "Demo readall user, using external role mapping"
snapshotrestore:
  hash: "$2y$12$DpwmetHKwgYnorbgdvORCenv4NAK8cPUg8AI6pxLCuWf/ALc0.v7W"
  reserved: false
  backend_roles:
  - "snapshotrestore"
  description: "Demo snapshotrestore user, using external role mapping"
`;
    fs.writeFileSync(path.join(certDir, 'internal_users.yml'), content, 'utf8');
}

/**
 * Generates TLS certs using mkcert and organizes the output files
 * into the layout expected by each service format.
 *
 * mkcert creates a locally-trusted CA and issues certificates signed by it.
 * This function handles the full lifecycle:
 *   1. Runs mkcert to produce a key + certificate for the given DNS names
 *   2. Copies the root CA certificate into a CAs/ subdirectory
 *   3. Renames/copies files into the structure each service expects
 *   4. Cleans up the raw mkcert output files
 *
 * Supported formats:
 *   - `minio`      → private.key, public.crt
 *   - `opensearch` → opensearch-key.pem, opensearch-cert.pem, internal_users.yml
 *   - `kafka`      → kafka-keypair.pem (key + cert concatenated)
 *
 * @param formats  - List of service formats to produce (e.g. ['minio', 'opensearch'])
 * @param dirPath  - Absolute path to the output directory (recreated if it already exists)
 * @param dnsNames - DNS names / IPs the certificate should be valid for
 * @throws {Error} If mkcert is not installed, dirPath is relative, or cert files cannot be found
 */
async function generateCerts(
    formats: string[],
    dirPath: string,
    dnsNames: string[]
): Promise<void> {
    // mkcert must be installed
    try {
        await execa('mkcert', ['--version']);
    } catch {
        throw new Error('mkcert is not installed. Please install mkcert and try again.');
    }

    if (!path.isAbsolute(dirPath)) {
        throw new Error('dirPath must be an absolute path');
    }

    if (dnsNames.length === 0) {
        throw new Error('At least one DNS name is required');
    }

    // Always start with a clean dir in the case there is stuff here
    if (fse.existsSync(dirPath)) {
        await fse.remove(dirPath);
    }
    await fse.mkdirp(dirPath);

    // Run mkcert in the output directory — it writes the key and cert files there
    await execa('mkcert', ['--client', ...dnsNames], { cwd: dirPath });

    // mkcert stores its root CA in a system dir. copy it into our cert dir
    const { stdout: caRoot } = await execa('mkcert', ['-CAROOT']);
    fse.copySync(path.join(caRoot.trim(), 'rootCA.pem'), path.join(dirPath, 'rootCA.pem'));

    // Move the root CA into a CAs/ subdirectory. Keeps it organized
    await fse.mkdirp(path.join(dirPath, 'CAs'));
    fse.moveSync(
        path.join(dirPath, 'rootCA.pem'),
        path.join(dirPath, 'CAs', 'rootCA.pem')
    );

    // mkcert names its output files based on the DNS names, so we locate them by pattern
    const files = fs.readdirSync(dirPath);
    const privateKeyName = files.find((f) => f.toLowerCase().includes('key.pem'));
    const publicCertName = files.find((f) => f.toLowerCase().endsWith('.pem') && !f.toLowerCase().includes('key.pem'));

    if (!privateKeyName || !publicCertName) {
        throw new Error(`Could not locate key.pem or public cert in ${dirPath}`);
    }

    const privateKeyPath = path.join(dirPath, privateKeyName);
    const publicCertPath = path.join(dirPath, publicCertName);

    // Copy/rename files into the layout each service expects. Each service like it in
    // a specific format.
    for (const format of formats) {
        switch (format) {
            case 'minio':
                // https://min.io/docs/minio/linux/operations/network-encryption.html
                fse.copySync(privateKeyPath, path.join(dirPath, 'private.key'));
                fse.copySync(publicCertPath, path.join(dirPath, 'public.crt'));
                break;
            case 'opensearch':
                // https://opensearch.org/docs/latest/security/configuration/tls/#x509-pem-certificates-and-pkcs-8-keys
                fse.copySync(privateKeyPath, path.join(dirPath, 'opensearch-key.pem'));
                fse.copySync(publicCertPath, path.join(dirPath, 'opensearch-cert.pem'));
                // Opensearch also needs a user database file alongside the certs
                createInternalUsersFile(dirPath);
                break;
            case 'kafka': {
                // https://kafka.apache.org/42/security/encryption-and-authentication-using-ssl/
                // Kafka expects key and cert in a single PEM file
                const keyContent = fs.readFileSync(privateKeyPath, 'utf8');
                const certContent = fs.readFileSync(publicCertPath, 'utf8');
                fs.writeFileSync(path.join(dirPath, 'kafka-keypair.pem'), keyContent + certContent, 'utf8');
                break;
            }
            default:
                signale.warn(`Unknown format '${format}' ignored.`);
        }
    }

    // Remove the original mkcert files now that we've copied and renamed them
    if (formats.length > 0) {
        fs.unlinkSync(privateKeyPath);
        fs.unlinkSync(publicCertPath);
    }

    // Make sure all cert files are readable
    await execa('chmod', ['-R', 'a+rX', dirPath]);
}

/**
 * Generates CA certificates for encrypted services in the test environment if needed
 *
 * @throws {Error} If certificate generation fails.
 */
export async function generateTestCaCerts(): Promise<void> {
    const encryptedServices: string[] = [];
    const hostNames: string[] = ['localhost'];

    if (config.ENCRYPT_OPENSEARCH) {
        encryptedServices.push('opensearch');
        hostNames.push(
            'opensearch2.services-dev1',
            'opensearch3.services-dev1',
            'opensearch',
            config.OPENSEARCH_HOSTNAME
        );
    }

    if (config.ENCRYPT_MINIO) {
        encryptedServices.push('minio');
        hostNames.push(
            'minio.services-dev1',
            'minio',
            config.MINIO_HOSTNAME
        );
    }

    if (config.ENCRYPT_KAFKA) {
        encryptedServices.push('kafka');
        hostNames.push(
            'kafka-headless.services-dev1.svc.cluster.local',
            'kafka-headless.services-dev1',
            'kafka-headless',
            'kafka',
            config.KAFKA_HOSTNAME
        );
    }

    if (encryptedServices.length > 0) {
        // Formats the encrypted service list to print with the user feedback
        const serviceList = encryptedServices.length === 1
            ? encryptedServices[0]
            : encryptedServices.length === 2
                ? encryptedServices.join(' and ')
                : `${encryptedServices.slice(0, -1).join(', ')} and ${encryptedServices[encryptedServices.length - 1]}`;

        try {
            signale.pending(`Generating new ca-certificates for ${serviceList}...`);
            signale.debug('Generating certs: ', { formats: encryptedServices, dirPath: config.CERT_PATH, dnsNames: hostNames });
            await generateCerts(encryptedServices, config.CERT_PATH, hostNames);
            signale.success(`Created certs in ${config.CERT_PATH}`);
        } catch (err) {
            throw new Error(`Error generating ca-certificates for ${serviceList}: ${err.message}`);
        }
    }
}

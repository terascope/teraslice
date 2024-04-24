import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TSError, parseError, Logger } from '@terascope/utils';
import { TerafoundationConnector } from './interfaces.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

type ErrorResult = {
    filePath: string;
    message: string;
}

async function requireConnector(
    filePath: string,
    errors: ErrorResult[]
): Promise<TerafoundationConnector | null> {
    let valid = true;
    let mod: any;

    try {
        mod = await import(filePath);
    } catch (err) {
        valid = false;
    }

    if (mod && mod.default) {
        mod = mod.default;
    }

    if (typeof mod !== 'object') {
        valid = false;
    }

    if (mod && typeof mod.config_schema !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required config_schema function`,
        });
        valid = false;
    }

    if (mod && typeof mod.createClient !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required create function`
        });

        valid = false;
    }

    if (valid) {
        return mod;
    }

    return null;
}

async function guardedRequire(
    filePath: string,
    errors: ErrorResult[]
): Promise<TerafoundationConnector | null> {
    try {
        return requireConnector(filePath, errors);
    } catch (error) {
        errors.push({
            filePath,
            message: parseError(error, true),
        });

        return null;
    }
}

export async function getConnectorModule(
    name: string,
    reason: string
): Promise<TerafoundationConnector | null> {
    let mod;

    // collect the errors
    const errors: ErrorResult[] = [];

    const localPath = `${path.join(dirname, 'connectors', name)}.js`;
    mod = await guardedRequire(localPath, errors);

    // check if its a node module
    if (!mod) {
        mod = await guardedRequire(name, errors);
    }

    // Still not found check for a connector with underscores
    if (!mod) {
        mod = await guardedRequire(`terafoundation_${name}_connector`, errors);
    }

    // Still not found check for a connector with dashes
    if (!mod) {
        mod = await guardedRequire(`terafoundation-${name}-connector`, errors);
    }

    // Stil not found check for the @terascope namespace
    if (!mod) {
        mod = await guardedRequire(`@terascope/${name}`, errors);
    }

    if (mod) return mod;

    if (errors.length) {
        const filePaths = errors.map(({ filePath }) => filePath);
        const messages = errors.map(({ message }) => message);
        throw new TSError(messages.join(', caused by '), {
            reason,
            context: {
                filePaths,
            }
        });
    }

    return null;
}

export async function getConnectorSchema(name: string): Promise<Record<string, any>> {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    const mod = await getConnectorModule(name, reason);

    if (!mod) {
        throw new TSError(`Could not find connector: ${name} to extract its schema`);
    }

    return mod.config_schema();
}

export async function createClient(
    name: string, moduleConfig: Record<string, any>, logger: Logger, options: Record<string, any>
) {
    const reason = `Could not find connector implementation for: ${name}\n`;

    const mod = await getConnectorModule(name, reason);
    if (!mod) {
        throw new Error(reason);
    }

    return mod.createClient(moduleConfig, logger, options);
}

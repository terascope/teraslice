import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TSError, parseError, Logger } from '@terascope/core-utils';
import type { Terafoundation } from '@terascope/types';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const pathFragments = dirname.split('/');
const terafoundationPathIndex = pathFragments.findIndex((name) => name === 'terafoundation') + 1;

const builtinConnectorPath = pathFragments.slice(0, terafoundationPathIndex).concat(['dist', 'src', 'connectors'])
    .join('/');

type ErrorResult = {
    filePath: string;
    message: string;
};

async function requireConnector<S>(
    filePath: string,
    errors: ErrorResult[]
): Promise<Terafoundation.Connector<S> | null> {
    let valid = true;
    let mod: any;

    try {
        mod = await import(filePath);

        if (mod && mod.default) {
            mod = mod.default;
            if (mod.default) {
                mod = mod.default;
            }
        }
    } catch (err) {
        valid = false;
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

    if (mod && mod.validate_config && typeof mod.validate_config !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} validate_config must be a function`,
        });
        valid = false;
    }

    if (mod && typeof mod.createClient !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required createClient function`
        });

        valid = false;
    }

    if (valid) {
        return mod;
    }

    return null;
}

async function guardedRequire<S>(
    filePath: string,
    errors: ErrorResult[]
): Promise<Terafoundation.Connector<S> | null> {
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

export async function getConnectorModule<S = Record<string, any>>(
    name: string,
    reason: string
): Promise<Terafoundation.Connector<S> | null> {
    let mod: Terafoundation.Connector<S> | null;

    // collect the errors
    const errors: ErrorResult[] = [];

    const localPath = `${path.join(builtinConnectorPath, name)}.js`;
    mod = await guardedRequire<S>(localPath, errors);

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

export async function getConnectorSchemaAndValFn<S>(
    name: string
): Promise<Terafoundation.Initializers<S>> {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    const mod = await getConnectorModule<S>(name, reason);

    if (!mod) {
        console.warn(`[WARNING] ${reason}`);
        return { schema: {} as Terafoundation.Schema<S> };
    }

    return { schema: mod.config_schema(), validatorFn: mod.validate_config };
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

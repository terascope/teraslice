import path from 'path';
import { TSError, parseError, Logger } from '@terascope/utils';

type ErrorResult = {
    filePath: string;
    message: string;
}

function requireConnector(filePath: string, errors: ErrorResult[]) {
    let mod = require(filePath);

    if (mod && mod.default) {
        mod = mod.default;
    }
    let valid = true;
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

    if (mod && typeof mod.create !== 'function') {
        errors.push({
            filePath,
            message: `Connector ${filePath} missing required create function`
        });
        valid = false;
    }

    if (valid) return mod;
    return null;
}

function guardedRequire(filePath: string, errors: ErrorResult[]) {
    try {
        return requireConnector(filePath, errors);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return false;
        }

        errors.push({
            filePath,
            message: parseError(error, true),
        });
        return null;
    }
}

export function getConnectorModule(name: string, reason: string): any {
    let mod;

    // collect the errors
    const errors: ErrorResult[] = [];

    const localPath = path.join(__dirname, 'connectors', name);
    mod = guardedRequire(localPath, errors);

    // check if its a node module
    if (!mod) {
        mod = guardedRequire(name, errors);
    }

    // Still not found check for a connector with underscores
    if (!mod) {
        mod = guardedRequire(`terafoundation_${name}_connector`, errors);
    }

    // Still not found check for a connector with dashes
    if (!mod) {
        mod = guardedRequire(`terafoundation-${name}-connector`, errors);
    }

    // Stil not found check for the @terascope namespace
    if (!mod) {
        mod = guardedRequire(`@terascope/${name}`, errors);
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

export function getConnectorSchema(name: string): Record<string, any> {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        console.warn(`[WARNING] ${reason}`);
        return {};
    }
    return mod.config_schema();
}

export function getConnectorSchemaValidation(name: string): Function | undefined {
    const reason = `Could not retrieve schema code for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        return undefined;
    } else if (typeof mod.validate_config === 'function') {
        return mod.validate_config;
    } else {
        return undefined;
    }
}

export function createConnection(
    name: string, moduleConfig: Record<string, any>, logger: Logger, options: Record<string, any>
): any {
    const reason = `Could not find connector implementation for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        throw new Error(reason);
    }

    return mod.create(moduleConfig, logger, options);
}

export async function createClient(
    name: string, moduleConfig: Record<string, any>, logger: Logger, options: Record<string, any>
) {
    const reason = `Could not find connector implementation for: ${name}\n`;

    const mod = getConnectorModule(name, reason);
    if (!mod) {
        throw new Error(reason);
    }

    return mod.createClient(moduleConfig, logger, options);
}

import { ConnectionConfig, Context, ValidatedJobConfig, OpConfig } from '@terascope/teraslice-types';
import { ExecutionContextAPI } from './execution-context-apis';
import { has } from 'lodash';

interface GetClientConfig {
    connection?: string;
    endpoint?: string;
    connection_cache?: boolean;
}

/*
* Returns the first op that matches name.
*/
export function getOpConfig(job: ValidatedJobConfig, name: string): OpConfig|undefined {
    return job.operations.find((op: OpConfig) => op._op === name);
}

/*
* This will request a connection based on the 'connection' attribute of
* an opConfig. Intended as a context API endpoint.
*/
export function getClient(context: Context, config: GetClientConfig, type: string): any {
    const clientConfig: ConnectionConfig = {
        type,
        cached: true,
        endpoint: 'default',
    };
    const events = context.apis.foundation.getSystemEvents();

    if (config && has(config, 'connection')) {
        clientConfig.endpoint = config.connection || 'default';
        const isCached = config.connection_cache != null;
        clientConfig.cached = isCached ? config.connection_cache : true;
    } else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }

    try {
        return context.foundation.getConnection(clientConfig).client;
    } catch (err) {
        const error = new Error(`No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config`);
        context.logger.error(error);
        events.emit('client:initialization:error', { error: error.message });
    }
}

export function registerApis(context: Context, job: ValidatedJobConfig): void {
    if (context.apis.op_runner == null) {
        context.apis.registerAPI('op_runner', {
            getClient(config: GetClientConfig, type: string): { client: any } {
                return getClient(context, config, type);
            },
        });
    }

    if (context.apis.executionContext == null) {
        context.apis.registerAPI('executionContext', new ExecutionContextAPI());
    }

    delete context.apis.job_runner;
    context.apis.registerAPI('job_runner', {
        getOpConfig(name: string): OpConfig|undefined {
            return getOpConfig(job, name);
        },
    });
}

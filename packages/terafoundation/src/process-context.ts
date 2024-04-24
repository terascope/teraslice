import { nanoid } from 'nanoid';
import validateConfigs from './validate-configs.js';
import { CoreContext } from './core-context.js';
import { getArgs } from './sysconfig.js';
import * as i from './interfaces.js';

/**
 * A Single Process Context, this should be used when running
 * in a single process instance/container. This context doesn't
 * support some of the multiple worker/assignment variations
 * that `ClusterContext` does, like `master` or `worker`.
 *
 * @todo add process event handler listeners in initialize method
 * @todo add shutdown handler logic with shutdown method
*/
export class ProcessContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> extends CoreContext<S, A, D> {
    static async createContext<
        S = Record<string, any>,
        A = Record<string, any>,
        D extends string = string
    >(
        config: i.FoundationConfig<S, A, D>,
        overrideArgs?: i.ParsedArgs<S>
    ) {
        const cluster: i.Cluster = {
            isMaster: false,
            worker: {
                id: nanoid(8),
            }
        } as any;

        const parsedArgs = overrideArgs || await getArgs<S>(
            config.default_config_file
        );

        const sysconfig = await validateConfigs(cluster, config, parsedArgs.configfile);

        return new ProcessContext<S, A, D>(
            config,
            cluster,
            sysconfig,
        );
    }
}

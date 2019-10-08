import shortid from 'shortid';
import validateConfigs from './validate-configs';
import { CoreContext } from './core-context';
import { getArgs } from './sysconfig';
import * as i from './interfaces';


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
    S = {},
    A = {},
    D extends string = string
> extends CoreContext<S, A, D> {
    constructor(
        config: i.FoundationConfig<S, A, D>,
        overrideArgs?: i.ParsedArgs<S>
    ) {
        const cluster: i.Cluster = {
            isMaster: false,
            worker: {
                id: shortid.generate(),
            }
        } as any;

        const parsedArgs = overrideArgs || getArgs<S>(
            config.default_config_file
        );

        const sysconfig = validateConfigs(cluster, config, parsedArgs.configfile);

        super(
            config,
            cluster,
            sysconfig,
        );
    }
}

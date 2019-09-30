import shortid from 'shortid';
import validateConfigs from './validate-configs';
import { CoreContext } from './core-context';
import { getArgs } from './sysconfig';
import * as i from './interfaces';


/**
 * A Single Process Context
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

import { nanoid } from 'nanoid';
import { CoreContext } from './core-context.js';
import { FoundationConfig, Cluster } from './interfaces.js';

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
    constructor(
        config: FoundationConfig<S, A, D>,
    ) {
        const cluster: Cluster = {
            isMaster: false,
            worker: {
                id: nanoid(8),
            }
        } as any;

        super(
            config,
            cluster,
        );
    }
}

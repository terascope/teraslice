import TerasliceUtil from './teraslice-util.js';
import reply from '../helpers/reply.js';

export default class Executions {
    config: Record<string, any>;
    teraslice: TerasliceUtil;

    constructor(cliConfig: Record<string, any>) {
        this.config = cliConfig;
        this.teraslice = new TerasliceUtil(this.config);
    }

    async recover(): Promise<void> {
        const instance = await this.teraslice.client.executions.wrap(this.config.args.id).recover();
        reply.info(`> ex_id ${this.config.args.id} recovered to ex_id: ${instance.id()}`);
    }
}

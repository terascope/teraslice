import TerasliceUtil from './teraslice-util';
import reply from '../cmds/lib/reply';

export default class Executions {
    /**
     *
     * @param {object} cliConfig config object
     *
     */
    config: any;
    teraslice: TerasliceUtil;

    constructor(cliConfig: any) {
        this.config = cliConfig;
        this.teraslice = new TerasliceUtil(this.config);
    }

    async recover() {
        const instance = await this.teraslice.client.executions.wrap(this.config.args.id).recover();
        reply.info(`> ex_id ${this.config.args.id} recovered to ex_id: ${instance.id()}`);
    }
}


import _ from 'lodash';
import TerasliceUtil from './teraslice-util';
import Reply from '../cmds/lib/reply';

const reply = new Reply();

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
        const response = await this.teraslice.client.executions.wrap(this.config.args.id).recover();
        if (_.has(response, 'ex_id')) {
            reply.info(`> ex_id ${this.config.args.id} recovered`);
        } else {
            // @ts-ignore
            reply.info(response);
        }
    }
}

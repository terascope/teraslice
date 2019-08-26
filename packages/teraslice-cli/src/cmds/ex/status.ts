
import { CMD } from '../../interfaces';
import Config from '../../lib/config';
import TerasliceUtil from '../../lib/teraslice-util';
import YargsOptions from '../../lib/yargs-options';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export default {
    command: 'status <cluster-alias> <id>',
    describe: 'Get the status of an execution id.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.strict()
            .example('$0 ex status cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        try {
            response = await teraslice.client.ex.status(cliConfig.args.id);
        } catch (err) {
            reply.fatal(`Error getting ex_id:${cliConfig.args.id} on ${cliConfig.args.clusterAlias}\n${err}`);
        }
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(response, null, 2));
    }
} as CMD;

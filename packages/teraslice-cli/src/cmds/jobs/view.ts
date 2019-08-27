
import { CMD } from '../../interfaces';
import _ from 'lodash';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';
import TerasliceUtil from '../../helpers/teraslice-util';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    // TODO: is it [id] or <id>
    command: 'view <cluster-alias> <id>',
    describe: 'View the job definition',
    builder(yargs:any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs view cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        try {
            response = await teraslice.client.jobs.wrap(cliConfig.args.id).config();
        } catch (err) {
            reply.fatal(`> job_id:${cliConfig.args.id} not found on ${cliConfig.args.clusterAlias}`);
        }

        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(response, null, 4));
    }
} as CMD;

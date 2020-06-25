import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import TerasliceUtil from '../../helpers/teraslice-util';
import YargsOptions from '../../helpers/yargs-options';
import reply from '../../helpers/reply';
import Display from '../../helpers/display';

const display = new Display();

const yargsOptions = new YargsOptions();

export = {
    command: 'stats <cluster-alias> [id]',
    describe: 'Show stats of the controller(s) on a cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 controllers stats cluster1', '');
        return yargs;
    },
    async handler(argv) {
        let response;
        const parse = false;
        const active = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);
        const format = `${cliConfig.args.output}Vertical`;
        const header = 'job_id';

        // older versions of teraslice do not have contollers end point
        try {
            response = await teraslice.client.cluster.controllers();
        } catch (e) {
            response = await teraslice.client.cluster.slicers();
        }

        if (Object.keys(response).length === 0) {
            reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
        }

        await display.display(header, response, format, parse, active);
    }
} as CMD;

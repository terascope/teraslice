import { CommandModule } from 'yargs';
import { ImagesAction, ImagesOptions } from '../helpers/images/interfaces.js';
import { images } from '../helpers/images/index.js';
import { GlobalCMDOptions } from '../helpers/interfaces.js';
import config from '../helpers/config.js';

interface Options {
    action?: ImagesAction;
}

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'images <action>',
    describe: 'Helper function related to docker images.',
    builder(yargs) {
        return yargs
            .example('$0 images list', 'Get the list of docker images needed for a test.')
            .example('$0 images save', 'Save the docker images needed for a test.')
            .option('kind-version', {
                description: 'Version of kind. Used to find the kind image tag pre-built for this release',
                type: 'string',
                default: config.KIND_VERSION
            })
            .option('k8s-version', {
                description: 'Version of kubernetes. Used to find the kind image tag pre-built for this k8s version',
                type: 'string',
                default: config.K8S_VERSION
            })
            .positional('action', {
                description: 'The action to take',
                choices: Object.values(ImagesAction),
                coerce(arg): ImagesAction {
                    return arg;
                },
            })
            .requiresArg('action');
    },
    async handler(argv) {
        const imagesOptions: ImagesOptions = {
            kindVersion: argv['kind-version'] as string,
            k8sVersion: argv['k8s-version'] as string
        };

        if (argv.action) {
            await images(argv.action, imagesOptions);
        }
    },
};

export default cmd;

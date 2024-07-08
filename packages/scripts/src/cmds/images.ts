import { CommandModule } from 'yargs';
import { ImagesAction } from '../helpers/images/interfaces';
import { images } from '../helpers/images';
import { GlobalCMDOptions } from '../helpers/interfaces';

interface Options {
    action?: ImagesAction;
}

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'images <action>',
    describe: 'Helper function related to docker images.',
    builder(yargs) {
        return yargs
            .example('$0 images list', 'Get the list of images needed for a test.')
            .example('$0 images load', 'Load the docker images needed for a test.')
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
        if (argv.action) {
            await images(argv.action);
        }
    },
};

export = cmd;

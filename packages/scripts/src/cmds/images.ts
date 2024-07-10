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
            .example('$0 images load --directory \'./e2e\' --script \'yarn test:elasticsearch7\'', 'Load the docker images needed for a test.')
            .example('$0 images save', 'Save the docker images needed for a test.')
            .option('directory', {
                type: 'string',
                description: 'Directory from which the test script we are loading images for will run.'
            })
            .option('script', {
                type: 'string',
                description: 'Script that test will use. This is needed to determine which images are needed.'
            })
            .positional('action', {
                description: 'The action to take',
                choices: Object.values(ImagesAction),
                coerce(arg): ImagesAction {
                    return arg;
                },
            })
            .check((args) => {
                if (args.action === ImagesAction.Load
                    && !args.directory
                    && !args.script
                ) {
                    throw new Error('"--script" and "--directory" options are required with "load" action');
                }
                return true;
            })
            .requiresArg('action');
    },
    async handler(argv) {
        if (argv.action) {
            await images(
                argv.action,
                argv.directory as string,
                argv.script as string
            );
        }
    },
};

export = cmd;

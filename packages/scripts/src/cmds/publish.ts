import { CommandModule } from 'yargs';
import { GlobalCMDOptions } from '../helpers/interfaces';
import { PublishType } from '../helpers/publish/interfaces';
import { publish } from '../helpers/publish';

type Options = {
    type: PublishType;
};

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'publish',
    describe: 'Publish npm, docker and documentation releases',
    builder(yargs) {
        return yargs.option('type', {
            description: 'The release type',
            demandOption: true,
            choices: Object.values(PublishType),
            coerce(arg): PublishType {
                return arg;
            },
        });
    },
    handler(argv) {
        return publish(argv.type);
    },
};

export = cmd;

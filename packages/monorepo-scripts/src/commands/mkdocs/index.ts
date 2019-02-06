
import yargs from 'yargs';

const mkdocs: yargs.CommandModule = {
    command: 'mkdocs <command>',
    describe: 'Generate docs for the monorepo',
    builder(yargs: yargs.Argv) {
        return yargs.strict();
    },
    handler() {

    }
};

export = mkdocs;

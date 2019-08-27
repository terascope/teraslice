
export = {
    args: (yargs: any) => {
        yargs
            .option('cluster_url', {
                alias: 'c',
                describe: 'cluster host name',
                default: 'http://localhost:5678',
            });
        return yargs.option;
    }
};

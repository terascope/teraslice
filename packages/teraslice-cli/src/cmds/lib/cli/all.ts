
export = {
    args: (yargs: any) => {
        yargs
        .option('all', {
            alias: 'a',
            describe: 'zips and deploys the asset to all the clusters in the asset/asset.json file',
            type: 'boolean',
            default: false,
        });
        return yargs.option;
    }
};

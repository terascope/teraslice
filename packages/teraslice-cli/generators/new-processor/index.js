'use strict';

const path = require('path');
const _ = require('lodash');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument('asset_path', { type: String, required: true });
        this.option('new');
    }

    async prompting() {
        if (this.options.new === true) {
            this.answers = await this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'New Processor name',
                    validate: (value) => {
                        if (value.length < 1) {
                            return 'Please enter a value';
                        }
                        return true;
                    },
                    filter: (value) => {
                        if (value.includes(' ')) {
                            return _.snakeCase(value.replace(/\/|'|\\/g, ''));
                        }
                        return value;
                    }
                },
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select the type of processor',
                    choices: [
                        'Batch',
                        'Map',
                        'Filter'
                    ]
                }
            ]);
        }
    }

    paths() {
        this.destinationRoot(path.join(this.options.asset_path));
    }

    createProcessor() {
        function capitolizeFirstLetter(value) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        let name = 'example';
        let type = 'Batch';

        if (this.options.new === true) {
            this.log('true');
            name = this.answers.name; // eslint-disable-line
            type = this.answers.type; // eslint-disable-line
        }

        const typeFunc = type === 'Batch' ? 'onBatch' : type.toLowerCase();

        this.fs.copyTpl(this.templatePath('base-op'),
            this.destinationPath(`asset/${name}`),
            {
                name: capitolizeFirstLetter(_.camelCase(name)),
                type,
                typeFunc
            });

        this.fs.copyTpl(this.templatePath('example-spec.txt'),
            this.destinationPath(`spec/${name}-spec.js`),
            { name });
    }
};

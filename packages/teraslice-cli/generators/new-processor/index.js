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
                    filter: value => _.snakeCase(value)
                },
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select the type of processor',
                    choices: [
                        'batch',
                        'map',
                        'filter'
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
        let type = 'batch';

        if (this.options.new === true) {
            name = this.answers.name; // eslint-disable-line
            type = this.answers.type; // eslint-disable-line
        }

        this.fs.copyTpl(this.templatePath('base-op/schema.js'), this.destinationPath(`asset/${name}/schema.js`));

        this.fs.copyTpl(this.templatePath(`base-op/${type}.js`),
            this.destinationPath(`asset/${name}/processor.js`),
            { name: capitolizeFirstLetter(_.camelCase(name)) });

        this.fs.copyTpl(this.templatePath(`tests/${type}-spec.js`),
            this.destinationPath(`test/${name}-spec.js`),
            { name });
    }
};

'use strict';

const path = require('path');
const _ = require('lodash');
const Generator = require('yeoman-generator');
const GeneratorUtil = require('../../lib/generator-util');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument('asset_path', { type: String, required: true });
        this.option('new');
        this.generatorUtil = new GeneratorUtil();
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
        let name = 'example';
        let type = 'Batch';

        if (this.options.new === true) {
            name = this.answers.name; // eslint-disable-line
            type = this.answers.type; // eslint-disable-line
        }

        const templateVariables = this.generatorUtil.processorTemplateVariables(type);

        this.fs.copyTpl(this.templatePath('base-op'),
            this.destinationPath(`asset/${name}`),
            {
                name: this.generatorUtil.capitolizeFirstLetter(_.camelCase(name)),
                type,
                typeFunc: templateVariables.typeFunc,
                dataType: templateVariables.dataType,
                sampleCode: templateVariables.sampleCode
            });

        this.fs.copyTpl(this.templatePath('example-spec.txt'),
            this.destinationPath(`spec/${name}-spec.js`),
            {
                name,
                testDescription: templateVariables.testDescription,
                testResult: templateVariables.testResult
            });
    }
};

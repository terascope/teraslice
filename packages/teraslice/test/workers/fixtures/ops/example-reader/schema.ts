import { BaseSchema } from '@terascope/job-components';

const defaultResults = Array.from(Array(10)).map(() => ({ hi: true }));
const defaultSlicerResults = [{ howdy: true }, null];
const defaultSlicerQueueLength = '10';

export default class Schema extends BaseSchema<Record<string, any>> {
    build() {
        return {
            errorAt: {
                doc: 'An array of indexes to error at',
                default: [],
                format: 'Array'
            },
            results: {
                doc: 'Reader results to return',
                default: defaultResults,
                format: 'Array'
            },
            slicerQueueLength: {
                doc: 'A string for the slicer queue length, anything but QUEUE_MINIMUM_SIZE will be converted to a number',
                default: defaultSlicerQueueLength,
                format: 'String'
            },
            slicerErrorAt: {
                doc: 'An array of indexes to error at when newSlicer is invoked',
                default: [],
                format: 'Array'
            },
            slicerResults: {
                doc: 'Slicer results to return',
                default: defaultSlicerResults,
                format: 'Array'
            },
            updateMetadata: {
                doc: 'Update the metadata on the slicer execution',
                default: false,
                format: Boolean
            }
        };
    }
}

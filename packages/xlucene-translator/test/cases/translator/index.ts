import fieldGroup from './field-group';
import geo from './geo';
import logicalGroup from './logical-group';
import termLevel from './term';

export * from './interfaces';

export default {
    term_level: termLevel,
    geo,
    field_group: fieldGroup,
    logical_group: logicalGroup,
};

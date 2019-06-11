import React from 'react';
import { Code } from '@terascope/ui-components';

const RestrictedInfo: React.FC = () => (
    <span>
        Use dot notation to specify nested properties, e.g. &nbsp;
        <Code inline>example.field</Code>
        <br />A field restriction on <Code inline>example</Code> will restrict{' '}
        <Code inline>example.field</Code>
    </span>
);

export default RestrictedInfo;

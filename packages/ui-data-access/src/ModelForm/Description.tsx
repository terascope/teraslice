import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormTextAreaProps } from 'semantic-ui-react';
import { Overwrite } from '@terascope/utils';
import { AnyModel, DefaultInputProps } from './interfaces';
import FormTextArea from './FormTextArea';

function Description<T extends DescriptionModel>({
    description,
    ...props
}: Props & DefaultInputProps<T>): React.ReactElement {
    return (
        <Form.Group>
        <FormTextArea<T>
                {...props}
                name="description"
                label="Description"
                value={description}
                width={8}
          />
      </Form.Group>
    );
}

type DescriptionModel = AnyModel & { description?: string };
type Props = Overwrite<
FormTextAreaProps,
{
    description?: string;
    value?: never;
}
>;

Description.propTypes = {
    description: PropTypes.string,
};

export default Description;

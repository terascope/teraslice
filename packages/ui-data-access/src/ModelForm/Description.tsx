import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormTextAreaProps } from 'semantic-ui-react';
import { AnyModel, DefaultInputProps } from './interfaces';
import FormInput from './FormInput';

function Description<T extends DescriptionModel>({
    description,
    ...props
}: Props & DefaultInputProps<T>): React.ReactElement {
    return (
        <Form.Group>
            <FormInput<T>
                {...props}
                as={Form.TextArea}
                name="description"
                label="Description"
                value={description}
                width={8}
            />
        </Form.Group>
    );
}

type DescriptionModel = AnyModel & { description?: string };
type Props = {
    description?: string;
} & FormTextAreaProps;

Description.propTypes = {
    description: PropTypes.string,
};

export default Description;

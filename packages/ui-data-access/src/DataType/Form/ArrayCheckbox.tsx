import React from 'react';
import { Checkbox } from 'semantic-ui-react';

const ArrayCheckbox: React.FC<Props> = ({ array, onChange }) => {
    return (
        <div className="daArrayCheckbox">
            <label>Array</label>
            <Checkbox
                checked={Boolean(array)}
                onChange={(e, { checked }) => {
                    e.preventDefault();
                    onChange(Boolean(checked));
                }}
            />
        </div>
    );
};

type Props = {
    array?: boolean;
    onChange: (array: boolean) => void;
};

export default ArrayCheckbox;

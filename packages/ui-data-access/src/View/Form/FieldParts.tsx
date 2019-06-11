import React from 'react';
import PropTypes from 'prop-types';

const FieldParts: React.FC<Props> = ({ field, className }) => {
    return (
        <div className={className}>
            {field.split('.').map((str, i) => (
                <span key={`${str}-${i}`} style={getPartStyle(i)}>
                    {i > 0 ? `.${str}` : str}
                </span>
            ))}
        </div>
    );
};

function getPartStyle(i: number): React.CSSProperties {
    const color = '#676767';
    if (i === 0) return { color, fontWeight: 600 };
    if (i === 1) return { color, fontWeight: 700 };
    if (i === 2) return { color, fontWeight: 800 };
    return { color, fontWeight: 900 };
}

type Props = {
    field: string;
    className?: string;
};

FieldParts.propTypes = {
    field: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default FieldParts;

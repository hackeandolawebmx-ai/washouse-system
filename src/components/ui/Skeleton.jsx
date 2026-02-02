import React from 'react';

const Skeleton = ({
    variant = 'text',
    width,
    height,
    className = ''
}) => {
    const baseClasses = "bg-gray-200 animate-pulse";

    const variants = {
        text: "h-4 rounded",
        circular: "rounded-full",
        rectangular: "rounded-md",
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variants[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;

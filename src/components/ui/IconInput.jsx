import React from 'react';
import { cn } from '../../lib/utils';

export default function IconInput({ icon: Icon, className, containerClassName, ...props }) {
    return (
        <div className={cn("relative", containerClassName)}>
            {Icon && (
                <Icon
                    className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none"
                    aria-hidden="true"
                />
            )}
            <input
                className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200",
                    "focus:outline-none focus:ring-2 focus:ring-washouse-blue focus:border-transparent",
                    "transition-all placeholder:text-gray-400",
                    className
                )}
                {...props}
            />
        </div>
    );
}

export default function Button({ children, variant = 'primary', className = '', loading = false, disabled, ...props }) {
    const baseStyles = "relative px-4 py-3 rounded-lg font-medium transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variants = {
        primary: "bg-washouse-blue text-white hover:bg-washouse-primary-hover border border-transparent",
        secondary: "bg-washouse-aqua text-white hover:bg-washouse-secondary-hover border border-transparent",
        outline: "bg-transparent border-2 border-washouse-blue text-washouse-blue hover:bg-blue-50",
        danger: "bg-red-500 text-white hover:bg-red-600 border border-transparent",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-500 border border-transparent"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            <span className={loading ? "opacity-0" : "opacity-100"}>{children}</span>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </button>
    );
}

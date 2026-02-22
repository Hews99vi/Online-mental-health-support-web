import React, { useId } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    helperText?: string;
    errorMessage?: string;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    /** Whether the field is required — shows a red asterisk */
    required?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
    (
        {
            label,
            helperText,
            errorMessage,
            startIcon,
            endIcon,
            required,
            id: externalId,
            className,
            ...rest
        },
        ref
    ) => {
        const generatedId = useId();
        const id = externalId ?? generatedId;
        const helperId = `${id}-helper`;
        const errorId = `${id}-error`;

        const hasError = Boolean(errorMessage);

        return (
            <div className={[styles.wrapper, hasError ? styles.error : '', className ?? ''].filter(Boolean).join(' ')}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                    {required && (
                        <span className={styles.required} aria-hidden="true">
                            *
                        </span>
                    )}
                </label>

                <div className={styles.inputWrapper}>
                    {startIcon && (
                        <span className={styles.startIcon} aria-hidden="true">
                            {startIcon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={id}
                        required={required}
                        aria-required={required}
                        aria-invalid={hasError}
                        aria-describedby={
                            [helperText ? helperId : '', hasError ? errorId : ''].filter(Boolean).join(' ') || undefined
                        }
                        className={[
                            styles.input,
                            startIcon ? styles.hasStartIcon : '',
                            endIcon ? styles.hasEndIcon : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        {...rest}
                    />

                    {endIcon && (
                        <span className={styles.endIcon} aria-hidden="true">
                            {endIcon}
                        </span>
                    )}
                </div>

                {helperText && !hasError && (
                    <p id={helperId} className={styles.helperText}>
                        {helperText}
                    </p>
                )}
                {hasError && (
                    <p id={errorId} className={styles.errorText} role="alert">
                        {errorMessage}
                    </p>
                )}
            </div>
        );
    }
);

TextField.displayName = 'TextField';

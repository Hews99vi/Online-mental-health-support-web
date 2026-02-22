import React from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    isLoading?: boolean;
    fullWidth?: boolean;
    /** Render as an anchor tag — pass href to use */
    as?: 'button' | 'a';
    href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            disabled,
            className,
            as: Tag = 'button',
            href,
            ...rest
        },
        ref
    ) => {
        const cls = [
            styles.btn,
            styles[variant],
            size !== 'md' ? styles[size] : '',
            fullWidth ? styles.fullWidth : '',
            className ?? '',
        ]
            .filter(Boolean)
            .join(' ');

        if (Tag === 'a' && href) {
            return (
                <a href={href} className={cls} role="button" tabIndex={0}>
                    {isLoading && <span className={styles.spinner} aria-hidden="true" />}
                    {children}
                </a>
            );
        }

        return (
            <button
                ref={ref}
                className={cls}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                {...rest}
            >
                {isLoading && <span className={styles.spinner} aria-hidden="true" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

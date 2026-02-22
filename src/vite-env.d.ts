/// <reference types="vite/client" />

/**
 * CSS Modules — tell TypeScript that any *.module.css import
 * returns an object keyed by class names.
 */
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}

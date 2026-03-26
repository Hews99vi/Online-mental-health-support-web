/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/**
 * CSS Modules — tell TypeScript that any *.module.css import
 * returns an object keyed by class names.
 */
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}

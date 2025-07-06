/**
 * Workaround for the TypeScript error: "Cannot find module 'langchain' or its corresponding type declarations."
 * This declares a module for 'langchain' so that TypeScript will accept the import.
 * Remove or adjust if/when official type definitions become available.
 */
declare module "langchain";

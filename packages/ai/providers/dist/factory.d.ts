import { ProviderType } from '@repo/shared';
import { BaseProvider } from './base.js';

interface ProviderOptions {
    apiKey?: string;
    modelId?: string;
}
declare class ProviderFactory {
    static create(type: ProviderType, options?: ProviderOptions): BaseProvider;
    static createFromEnv(): BaseProvider;
    static createAll(): Record<ProviderType, BaseProvider | null>;
}

export { ProviderFactory, type ProviderOptions };

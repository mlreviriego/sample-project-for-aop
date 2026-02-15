import { Logger } from "../utils/Logger";

export class CacheService {
    private cache: Map<string, { data: any; expiry: number }> = new Map();
    private defaultTTL = 60000; // 60 seconds

    set(key: string, value: any, ttl: number = this.defaultTTL): void {
        Logger.debug(`Caching data with key: ${key}`);
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data: value, expiry });
    }

    get(key: string): any | null {
        Logger.debug(`Checking cache for key: ${key}`);
        const cached = this.cache.get(key);

        if (!cached) {
            Logger.debug(`Cache miss for key: ${key}`);
            return null;
        }

        if (Date.now() > cached.expiry) {
            Logger.debug(`Cache expired for key: ${key}`);
            this.cache.delete(key);
            return null;
        }

        Logger.debug(`Cache hit for key: ${key}`);
        return cached.data;
    }

    invalidate(key: string): void {
        Logger.debug(`Invalidating cache for key: ${key}`);
        this.cache.delete(key);
    }

    clear(): void {
        Logger.info("Clearing all cache");
        this.cache.clear();
    }
}

/**
 * Represents a cache that stores key-value pairs with a Time-To-Live (TTL)
 * and a maximum capacity (LRU eviction).
 */
class Cache {
    /**
     * Creates a new Cache instance.
     * @param {number} expirationTime - Default expiration time for key-value pairs in milliseconds.
     * Defaults to 30 minutes (30 * 60 * 1000 ms).
     * @param {number} maxSize - Maximum number of items the cache can hold.
     * Defaults to 1000.
     * @param {number} cleanupInterval - Frequency of background cleanup of expired items in milliseconds.
     * Set to 0 to disable active background cleanup. Defaults to 10 seconds (10 * 1000 ms).
     */
    constructor(expirationTime = 30 * 60 * 1000, maxSize = 1000, cleanupInterval = 10 * 1000) {
        /**
         * The internal Map storing key-value pairs and their expiration metadata.
         * Map preserves insertion order, which is used for LRU eviction.
         * @type {Map}
         * @private
         */
        this.cache = new Map();

        /**
         * Default expiration time in milliseconds.
         * @type {number}
         * @private
         */
        this.expirationTime = expirationTime;

        /**
         * Maximum capacity of the cache.
         * @type {number}
         * @private
         */
        this.maxSize = maxSize;

        /**
         * Periodic timer for active background eviction of expired items.
         * @private
         */
        if (cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => this.evictExpired(), cleanupInterval);
            // unref allows the Node.js process to exit even if the timer is still active
            if (this.cleanupTimer.unref) {
                this.cleanupTimer.unref();
            }
        }
    }

    /**
     * Adds a key-value pair to the cache. If the cache is full, the least recently used (LRU) item is evicted.
     * @param {*} key - The key for the pair.
     * @param {*} value - The value to store.
     * @param {number} expirationTime - Custom expiration time in milliseconds for this specific pair.
     */
    put(key, value, expirationTime = this.expirationTime) {
        const now = Date.now();
        const expiration = now + expirationTime;

        // If the key already exists, delete it first to refresh its insertion order (LRU)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Evict the oldest (first) item in the Map
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, { value, expiration });
    }

    /**
     * Retrieves the value for the given key from the cache, if it exists and is not expired.
     * Refreshes the item's insertion order (LRU).
     * @param {*} key - The key to look up.
     * @returns {*} The cached value, or undefined if the key is missing or expired.
     */
    get(key) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached) {
            if (cached.expiration > now) {
                // Refresh insertion order (LRU): delete and re-insert
                this.cache.delete(key);
                this.cache.set(key, cached);
                return cached.value;
            }
            // Evict expired item
            this.cache.delete(key);
        }

        return undefined;
    }

    /**
     * Checks if a key exists in the cache and is not expired.
     * Does not update the LRU order (view-only check).
     * @param {*} key - The key to check.
     * @returns {boolean} True if the key exists and is active, false otherwise.
     */
    has(key) {
        const now = Date.now();
        const cached = this.cache.get(key);
        if (cached && cached.expiration > now) {
            return true;
        }
        if (cached) {
            this.cache.delete(key); // Lazy cleanup
        }
        return false;
    }

    /**
     * Removes the key-value pair with the given key from the cache.
     * @param {*} key - The key to remove.
     * @returns {boolean} True if the key was found and removed, false otherwise.
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Removes all key-value pairs from the cache.
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Returns an array of all active (non-expired) keys in the cache.
     * @returns {Array} An array of active keys.
     */
    keys() {
        const now = Date.now();
        const activeKeys = [];
        for (const [key, cached] of this.cache.entries()) {
            if (cached.expiration > now) {
                activeKeys.push(key);
            } else {
                this.cache.delete(key); // Lazy cleanup
            }
        }
        return activeKeys;
    }

    /**
     * Returns the number of active (non-expired) key-value pairs currently in the cache.
     * @returns {number} The count of active items.
     */
    size() {
        return this.keys().length;
    }

    /**
     * Scans the cache and evicts any expired entries.
     */
    evictExpired() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (cached.expiration <= now) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Stops the background cleanup timer to prevent memory/resource leaks.
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }
}

module.exports = {
    Cache
};


const { Cache } = require('./cache.js');

// 1. Create a cache with standard settings (expires after 30 minutes by default)
const myCache = new Cache();

// Add objects to the cache with default expiration time
myCache.put('myKey1', { myValue: 'hello' });
myCache.put('myKey2', { myValue: 'world' });

// Add an object to the cache with a custom expiration time (5 seconds)
myCache.put('myKey3', { myValue: 'foo' }, 5 * 1000);

// Retrieve objects from the cache
console.log('Retrieving myKey1:', myCache.get('myKey1')); // { myValue: 'hello' }
console.log('Retrieving myKey2:', myCache.get('myKey2')); // { myValue: 'world' }
console.log('Retrieving myKey3:', myCache.get('myKey3')); // { myValue: 'foo' }

// Wait for 6 seconds (longer than the expiration time of myKey3)
setTimeout(() => {
    console.log('\n--- After 6 seconds (TTL Expiration) ---');
    const myObject3Expired = myCache.get('myKey3');
    console.log('Retrieving myKey3 (expired):', myObject3Expired); // undefined (cache miss)
    console.log('Active keys in cache:', myCache.keys()); // [ 'myKey1', 'myKey2' ]
    console.log('Cache size:', myCache.size()); // 2

    // 2. Demonstrate LRU Capacity Eviction Strategy
    console.log('\n--- Demonstrating LRU Capacity Eviction ---');
    // Create a cache that only holds a maximum of 2 items
    const lruCache = new Cache(30 * 60 * 1000, 2);
    
    lruCache.put('a', 'Apple');
    lruCache.put('b', 'Banana');
    
    // Access 'a' to make 'b' the Least Recently Used item
    lruCache.get('a');
    
    // Add a third item 'c' (exceeds capacity of 2)
    lruCache.put('c', 'Cherry');
    
    console.log("Is 'a' still in cache?", lruCache.has('a')); // true
    console.log("Is 'b' still in cache?", lruCache.has('b')); // false (evicted because it was LRU!)
    console.log("Is 'c' in cache?", lruCache.has('c')); // true
    
    // Clean up background timers to allow the script to exit cleanly
    myCache.destroy();
    lruCache.destroy();
}, 6000);


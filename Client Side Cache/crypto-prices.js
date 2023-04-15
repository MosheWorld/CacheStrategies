// Client-Side Cache Demo - Simple Implementation

const resultElement = document.getElementById('result');
const CACHE_DURATION_SECONDS = 10;

// Fetches the cryptocurrency price or loads it from local storage if fresh
async function fetchPriceWithCache(symbol) {
    const cacheKey = `crypto_price_${symbol}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const { timestamp, price } = JSON.parse(cachedData);
        const ageInSeconds = (Date.now() - timestamp) / 1000;

        // If the cached price is less than 10 seconds old, load it from cache
        if (ageInSeconds < CACHE_DURATION_SECONDS) {
            const secondsRemaining = Math.floor(CACHE_DURATION_SECONDS - ageInSeconds);
            
            resultElement.className = 'result cached';
            resultElement.textContent = `${symbol} Price: $${price} (Loaded from Cache. Expires in ${secondsRemaining}s)`;
            return;
        }
    }

    // Otherwise, retrieve fresh price from Coinbase API
    try {
        const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const json = await response.json();
        const price = json.data.amount;

        // Store the price and current timestamp in localStorage
        const cacheEntry = { price, timestamp: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

        resultElement.className = 'result fresh';
        resultElement.textContent = `${symbol} Price: $${price} (Loaded from API)`;
    } catch (error) {
        resultElement.className = 'result error';
        resultElement.textContent = `Failed to fetch price for ${symbol}`;
        console.error(error);
    }
}

// Bind click event handlers
document.getElementById('bitcoin-btn').addEventListener('click', () => fetchPriceWithCache('BTC'));
document.getElementById('ethereum-btn').addEventListener('click', () => fetchPriceWithCache('ETH'));

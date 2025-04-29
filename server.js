const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// In-memory storage for access counts with mutex
const accessCounts = {};
const mutex = new Map(); // Using Map to store mutexes for each ticker
let cachedSECData = null;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to fetch data from SEC
async function fetchSECData() {
    try {
        const response = await axios.get('https://www.sec.gov/files/company_tickers_exchange.json', {
            headers: {
                'User-Agent': 'John Doe (test@example.com)'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching SEC data:', error.message);
        throw error;
    }
}

// Thread-safe increment function
async function incrementAccessCount(ticker) {
    // Get or create mutex for this ticker
    if (!mutex.has(ticker)) {
        mutex.set(ticker, { locked: false, queue: [] });
    }
    const tickerMutex = mutex.get(ticker);

    // Return a promise that resolves when the increment is complete
    return new Promise((resolve) => {
        const acquireLock = () => {
            if (!tickerMutex.locked) {
                tickerMutex.locked = true;
                // Perform the increment
                accessCounts[ticker] = (accessCounts[ticker] || 0) + 1;
                tickerMutex.locked = false;
                // Process next in queue if any
                if (tickerMutex.queue.length > 0) {
                    const next = tickerMutex.queue.shift();
                    next();
                }
                resolve();
            } else {
                // Add to queue and wait
                tickerMutex.queue.push(acquireLock);
            }
        };
        acquireLock();
    });
}

// Initialize SEC data on server startup
async function initializeSECData() {
    try {
        console.log('Fetching SEC data...');
        const startTime = process.hrtime();
        cachedSECData = await fetchSECData();
        console.log(cachedSECData.data.length)
        const endTime = process.hrtime(startTime);
        const latency = (endTime[0] * 1000) + (endTime[1] / 1000000);
        console.log(`SEC data fetched successfully in ${latency.toFixed(2)}ms`);
    } catch (error) {
        console.error('Failed to initialize SEC data:', error.message);
        process.exit(1); // Exit if we can't get the initial data
    }
}

// Endpoint to get company data by ticker
app.get('/ticker/:ticker', async (req, res) => {
    const startTime = process.hrtime();
    try {
        const { ticker } = req.params;
        
        // Find the company with matching ticker from cached data
        const company = cachedSECData.data.find(item => item[2] === ticker.toUpperCase());
        
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Thread-safe increment of access count
        await incrementAccessCount(ticker);

        // Format the response
        const response = {
            cik: company[0],
            name: company[1],
            ticker: company[2],
            exchange: company[3]
        };

        const endTime = process.hrtime(startTime);
        const latency = (endTime[0] * 1000) + (endTime[1] / 1000000);
        console.log(`GET /ticker/${ticker} - Latency: ${latency.toFixed(2)}ms`);

        res.json(response);
    } catch (error) {
        const endTime = process.hrtime(startTime);
        const latency = (endTime[0] * 1000) + (endTime[1] / 1000000);
        console.log(`GET /ticker/${req.params.ticker} - Error - Latency: ${latency.toFixed(2)}ms`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to get access counts
app.get('/activity', (req, res) => {
    const startTime = process.hrtime();
    res.json(accessCounts);
    const endTime = process.hrtime(startTime);
    const latency = (endTime[0] * 1000) + (endTime[1] / 1000000);
    console.log(`GET /activity - Latency: ${latency.toFixed(2)}ms`);
});

// Initialize the server
initializeSECData().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}); 
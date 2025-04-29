# SEC Data API Server

A Node.js server that provides an API to access SEC (Securities and Exchange Commission) company data and tracks access statistics.

## Features

- Fetches and caches SEC company data
- Provides company information by ticker symbol
- Thread-safe access counting
- Performance monitoring with latency tracking
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

Start the server:
```bash
node server.js
```

The server will start on port 3000.

### API Endpoints

- `GET /ticker/:ticker` - Get company information by ticker symbol
- `GET /activity` - Get access statistics for all tickers

### Example Usage

```bash
# Get company information
curl http://localhost:3000/ticker/AAPL

# Get access statistics
curl http://localhost:3000/activity
```

## Error Handling

The server includes comprehensive error handling and logging:
- 404 for non-existent companies
- 500 for internal server errors
- Detailed error messages in the response

## Performance

The server includes:
- In-memory caching of SEC data
- Thread-safe access counting
- Latency monitoring for all endpoints
- Efficient data structures for quick lookups

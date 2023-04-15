# Distributed Cache Demonstration

This project provides a simple, automated demonstration of a **Distributed Cache** using Redis (with authentication enabled) and two independent Node.js microservices (`Catalog Service` and `Recommendation Service`) running in separate Docker containers.

---

## 📂 Project Structure

To maintain high code standards, the project uses a modular design with shared utilities located under the `src/` directory:

```text
├── src/
│   ├── catalog-service.js         # Entrypoint for Catalog Service (Queries & Caches product details)
│   ├── recommendation-service.js  # Entrypoint for Recommendation Service (Uses cached product details)
│   └── utils/
│       ├── redis-client.js        # Shared Redis connection initialization using dotenv
│       └── db.js                  # Database queries simulator
├── .env                           # Local environment configuration file
├── .gitignore                     # Git configuration ignoring dependencies, secrets, and OS files
├── Dockerfile                     # Docker image specifications for Node.js services
├── docker-compose.yml             # Local orchestration details for Redis & both services (with Authentication)
├── run.bat / run.sh               # 1-click execution scripts (Windows / Unix)
└── README.md                      # Detailed setup guide
```

---

## 💡 What is a Distributed Cache?

In a distributed system, a single in-memory cache (like a local JS object or Map) is not sufficient because different instances of your application run in separate processes or containers. If **Service A** updates its local cache, **Service B** remains unaware of it.

A **Distributed Cache** solves this by centralizing the cached data in a dedicated, high-performance database like **Redis**. Any service node can read from or write to it, allowing them to share the cache state seamlessly:

```mermaid
graph TD
    subgraph Clients
        ClientA[Client Request 1] --> Catalog
        ClientB[Client Request 2] --> Rec
    end

    subgraph Service Layer (Isolated Containers)
        Catalog[Catalog Service]
        Rec[Recommendation Service]
    end

    subgraph Cache & Database Layer
        Catalog -->|1. Cache Miss / 3. Populate| Redis[(Redis Cache)]
        Rec -->|2. Instant Cache Hit| Redis
        Catalog -->|4. Query DB (Slow)| DB[(Database)]
        Rec -->|5. Query DB (Slow)| DB
    end

    style Redis fill:#f9f,stroke:#333,stroke-width:2px
```

---

## ⚙️ Configuration (.env)

Connection details and authentication secrets are loaded from the root [.env](./.env) file:
```ini
# Redis Connection Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mysecretpassword
```

The [docker-compose.yml](./docker-compose.yml) environment variables inject these parameters into the application containers and configure the Redis instance with `--requirepass` to enforce password authentication.

---

## 🚀 How to Run the Demo (1-Click Executable)

You can run the entire simulation with a single command. 

### Prerequisites
Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Execution Instructions
- **On Windows**: Double-click [run.bat](./run.bat) or run it from your command line:
  ```cmd
  .\run.bat
  ```
- **On Unix/macOS**: Open a terminal, make the script executable, and run it:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

---

## 🕒 The Simulation Timeline

When executed, the system performs the following sequence to demonstrate cache hits, misses, sharing, and expiration:

| Time | Service | Action | Expected Output | Concept Illustrated |
| :--- | :--- | :--- | :--- | :--- |
| **T = 0s** | `Catalog Service` | Reads `product:42` | **CACHE MISS** | Initial state (empty cache). |
| **T = 0s** | `Catalog Service` | Fetches from Database | **Takes 2.0s** | Bypassing cache to retrieve from database (simulates 2000ms latency). |
| **T = 2s** | `Catalog Service` | Writes to Redis | **TTL = 10s** | Populates the centralized cache with a 10-second Time-To-Live. |
| **T = 4s** | `Recommendation Service` | Reads `product:42` | **CACHE HIT (0ms)** | Bypasses the database completely and reads from the shared Redis instance. |
| **T = 12s**| - | Key Expires | - | Redis automatically evicts the expired cache key. |
| **T = 13s**| `Recommendation Service` | Reads `product:42` | **CACHE MISS** | Key is gone due to expiration. |
| **T = 13s**| `Recommendation Service` | Fetches from Database | **Takes 2.0s** | Node fetches from database again to refresh the cache. |
| **T = 15s**| `Recommendation Service` | Writes to Redis | **TTL = 10s** | Populates cache again. |
| **T = 20s**| `Catalog Service` | Reads `product:42` | **CACHE HIT (0ms)** | Reads updated data from the cache populated by the other node. |

---

## 🔍 Understanding the Logs

Once you start the demo, you will see consolidated logs in your terminal that look like this:

```text
[Catalog Service]        [T+0.0s] Check Redis cache for "product:42"...
[Catalog Service]        [T+0.0s] Check Redis cache for "product:42" -> [CACHE MISS] (took 8ms)
[Catalog Service]        [T+0.0s] Executing slow database query for "product:42"...
[Catalog Service]        [T+2.0s] DB Query finished (took 2000ms). Returning: "Gaming Laptop"
[Catalog Service]        [T+2.0s] Populating Redis with "product:42" (TTL: 10s)

[Recommendation Service] [T+4.0s] Check Redis cache for "product:42"...
[Recommendation Service] [T+4.0s] Check Redis cache for "product:42" -> [CACHE HIT] (took 2ms)
[Recommendation Service] [T+4.0s] Bypassed database query. Returned: {"id":42,"name":"Gaming Laptop","source":"Database (Slow Query)"}

[Recommendation Service] [T+13.0s] Check Redis cache for "product:42"...
[Recommendation Service] [T+13.0s] Check Redis cache for "product:42" -> [CACHE MISS] (Expired/Not Found) (took 0ms)
[Recommendation Service] [T+13.0s] Executing slow database query for "product:42"...
[Recommendation Service] [T+15.0s] DB Query finished (took 2000ms). Returning: "Gaming Laptop"
[Recommendation Service] [T+15.0s] Populating Redis with "product:42" (TTL: 10s)

[Catalog Service]        [T+20.0s] Check Redis cache for "product:42"...
[Catalog Service]        [T+20.0s] Check Redis cache for "product:42" -> [CACHE HIT] (took 1ms)
[Catalog Service]        [T+20.0s] Bypassed database query. Returned: {"id":42,"name":"Gaming Laptop","source":"Database (Slow Query)"}
```

Notice how **latency** drops from **2000ms** to **~0-2ms** on cache hits, and how `Recommendation Service` instantly benefits from the work done by `Catalog Service` without any direct communication between the two application processes.

# @topside-db/redis

Redis client package for the Topside DB project.

## Usage

```typescript
import { redis } from "@topside-db/redis";

// Use the ready-to-use redis client
await redis.set("key", "value");
const value = await redis.get("key");
```

## Configuration

The Redis client connects to the Redis instance defined in `docker-compose.yml`. By default, it connects to `redis://localhost:6379`.

You can override the connection URL by setting the `REDIS_URL` environment variable:

```bash
REDIS_URL=redis://localhost:6379
```

## Features

- Pre-configured and connected Redis client
- Automatic error handling
- Environment variable support
- TypeScript support


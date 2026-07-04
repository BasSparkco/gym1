import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL ?? 'redis://localhost:6379');
    this.on('error', (err) => console.error('[RedisService] error event:', err));
  }

  async onModuleDestroy() {
    await this.quit();
  }
}

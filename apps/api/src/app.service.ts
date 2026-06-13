import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Spark Gym ERP API',
      status: 'ok',
      version: '0.1.0',
      prefix: '/api',
    };
  }
}

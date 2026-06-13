import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return application metadata', () => {
      expect(appController.getRoot()).toEqual({
        name: 'Spark Gym ERP API',
        status: 'ok',
        version: '0.1.0',
        prefix: '/api',
      });
    });
  });
});

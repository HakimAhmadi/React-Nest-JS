import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './utils/databases/seeder.service';
import * as Entities from './utils/databases/schema/entities';
import { SUBSCRIBERS } from './utils/databases/schema/subscribers';
import { INDEX_POS_ADMIN_CONN } from './utils/databases/constants';
import { Users } from './utils/databases/schema/entities/users';
import { SystemSettings } from './utils/databases/schema/entities/system-settings';

const dbEntities = Object.values(Entities);

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      name: INDEX_POS_ADMIN_CONN,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASS'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [...dbEntities],
        synchronize: configService.get<string>('DATABASE_SYNC') === 'true',
        timezone: 'Z',
        subscribers: [...SUBSCRIBERS],
      }),
    }),
    TypeOrmModule.forFeature([Users, SystemSettings], INDEX_POS_ADMIN_CONN),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
class SeederAppModule {}

async function runSeeder() {
  const app = await NestFactory.createApplicationContext(SeederAppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const seeder = app.get(SeederService);
  await seeder.seed();

  await app.close();
  process.exit(0);
}

runSeeder().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Entities from './schema/entities';
import { SUBSCRIBERS } from './schema/subscribers';
// import { SeederService } from './seeder.service';
import { INDEX_POS_ADMIN_CONN } from './constants';

export const dbEntities = Object.values(Entities);

export * from './schema/entities';
export * from './constants';

@Global()
@Module({
  imports: [
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
    TypeOrmModule.forFeature([...dbEntities], INDEX_POS_ADMIN_CONN),
  ],
  providers: [],
  exports: [TypeOrmModule,],
})
export class CoreBackendUtilsDatabasesModule { }

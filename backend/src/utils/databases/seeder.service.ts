import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Users } from './schema/entities/users';
import { SystemSettings } from './schema/entities/system-settings';
import { INDEX_POS_ADMIN_CONN } from './constants';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Users, INDEX_POS_ADMIN_CONN)
    private usersRepository: Repository<Users>,
    @InjectRepository(SystemSettings, INDEX_POS_ADMIN_CONN)
    private settingsRepository: Repository<SystemSettings>,
  ) {}


  async seed() {
    this.logger.log('Starting database seeding...');

    // 1. Ensure Admin User exists
    const adminEmail = 'admin@example.com';
    const adminUser = await this.usersRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      this.logger.log(`Creating sample admin user: ${adminEmail}...`);
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await this.usersRepository.save(
        this.usersRepository.create({
          name: 'System Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        }),
      );
      this.logger.log('Sample admin user created successfully.');
    } else {
      this.logger.log('Admin user already exists.');
    }

    // 2. Seed default system settings
    const defaultSettings: {
      key: string;
      value: string;
      group: string;
      description: string;
    }[] = [
      {
        key: 'appName',
        value: 'Generic Platform',
        group: 'general',
        description: 'Application display name',
      },
      {
        key: 'appEmail',
        value: 'admin@example.com',
        group: 'general',
        description: 'Application contact email',
      },
      {
        key: 'sessionTimeout',
        value: '60',
        group: 'security',
        description: 'Session timeout in minutes',
      },
      {
        key: 'mfaRequired',
        value: 'false',
        group: 'security',
        description: 'Require 2FA for all admins',
      },
      {
        key: 'notif_user_registration',
        value: 'true',
        group: 'notifications',
        description: 'Notify on user registration',
      },
    ];

    for (const setting of defaultSettings) {
      const exists = await this.settingsRepository.findOne({
        where: { key: setting.key },
      });
      if (!exists) {
        await this.settingsRepository.save(
          this.settingsRepository.create(setting),
        );
      }
    }
    this.logger.log('Default system settings seeding completed.');

    this.logger.log('Database seeding completed.');
  }
}

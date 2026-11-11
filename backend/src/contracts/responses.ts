import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ type: 'integer' }) statusCode: number;
  @ApiProperty() message: string;
  @ApiProperty() code: string;
  @ApiPropertyOptional({ type: [String] }) errors?: string[];
  @ApiPropertyOptional() requestId?: string;
}

export class UserSummaryResponse {
  @ApiProperty({ type: 'integer' }) id: number;
  @ApiProperty() email: string;
  @ApiPropertyOptional({ type: String, nullable: true }) firstName?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) lastName?: string | null;
  @ApiProperty({ type: [String] }) roles: string[];
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
}

export class AuthResponse {
  @ApiProperty({ type: UserSummaryResponse }) user: UserSummaryResponse;
  @ApiProperty({ type: [String] }) roles: string[];
  @ApiProperty({ type: [String] }) permissions: string[];
  @ApiProperty() accessToken: string;
}

export class AuditLogResponse {
  @ApiProperty({ type: 'integer' }) id: number;
  @ApiPropertyOptional({ type: 'integer', nullable: true }) userId?: number | null;
  @ApiProperty() action: string;
  @ApiProperty() entity: string;
  @ApiPropertyOptional({ type: String, nullable: true }) entityId?: string | null;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  details?: Record<string, unknown> | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
}

export class SystemSettingResponse {
  @ApiProperty() key: string;
  @ApiProperty() value: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
}

export class HealthResponse {
  @ApiProperty() status: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) info?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) error?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) details?: Record<
    string,
    unknown
  >;
}

export const responseModels = [
  ApiErrorResponse,
  UserSummaryResponse,
  AuthResponse,
  AuditLogResponse,
  SystemSettingResponse,
  HealthResponse,
];

import { ObjectId } from 'mongodb';

export class LoggerMongoEntity {
  _id?: ObjectId; // ID gerado pelo MongoDB
  userId?: string;
  level: string;
  message: string;
  context?: string;
  timestamp: Date;

  static fromDomain(domain: LoggerDomainEntity): LoggerMongoEntity {
    return {
      _id: domain.id ? new ObjectId(domain.id) : undefined,
      userId: domain.userId,
      level: domain.level,
      message: domain.message,
      context: domain.context,
      timestamp: domain.timestamp,
    };
  }

  static toDomain(mongo: LoggerMongoEntity): LoggerDomainEntity {
    return {
      id: mongo._id?.toHexString() ?? '',
      userId: mongo.userId,
      level: mongo.level,
      message: mongo.message,
      context: mongo.context,
      timestamp: mongo.timestamp,
    };
  }
}

export interface LoggerDomainEntity {
  id?: string;
  userId?: string;
  level: string;
  message: string;
  context?: string;
  timestamp: Date;
}

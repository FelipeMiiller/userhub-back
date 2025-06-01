import { CreateLoggerDto } from '../../http/dto/create-logger.dto';

export interface ILoggersRepository {
  create(createLoggerDto: CreateLoggerDto): Promise<void>;
  findAll(): Promise<any[]>;
  findAllByLevel(level: string): Promise<any[]>;
  findAllByUserId(id: string): Promise<any[]>;
  findAllByUserIdAndLevel(id: string, level: string): Promise<any[]>;
  findOne(id: string): Promise<any>;
}

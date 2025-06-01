import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LoggerDocument = HydratedDocument<Logger>;

@Schema()
export class Logger {
  @Prop()
  userId?: string;

  @Prop({ required: true })
  level: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  context?: string;

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;

  @Prop({ type: Object, required: false })
  meta?: object;
}

export const LoggerSchema = SchemaFactory.createForClass(Logger);

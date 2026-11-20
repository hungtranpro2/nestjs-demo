import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  softDeletePlugin,
  type SoftDeletable,
} from '../../common/plugins/soft-delete.plugin.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User implements SoftDeletable {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  phone!: string;

  @Prop()
  age!: number;

  @Prop()
  address!: string;

  @Prop({ default: 'USER' })
  role!: string;

  isDeleted!: boolean;

  deletedAt?: Date | null;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(softDeletePlugin);

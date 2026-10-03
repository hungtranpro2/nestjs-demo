import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CompanyStatus } from '../company.constants.js';
import {
  softDeletePlugin,
  type SoftDeletable,
} from '../../common/plugins/soft-delete.plugin.js';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true })
export class Company implements SoftDeletable {
  @Prop()
  name!: string;

  @Prop({ type: String, enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status?: CompanyStatus;

  @Prop()
  address!: string;

  @Prop()
  description!: string;

  isDeleted!: boolean;

  deletedAt?: Date | null;

  @Prop({ type: Object })
  createdBy!: {
    _id: Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  updatedBy!: {
    _id: Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  deletedBy!: {
    _id: Types.ObjectId;
    email: string;
  };

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.plugin(softDeletePlugin);

CompanySchema.index({ createdAt: -1, _id: -1 });
CompanySchema.index({ status: 1, createdAt: -1, _id: -1 });

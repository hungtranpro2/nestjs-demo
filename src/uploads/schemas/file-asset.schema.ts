import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class FileAsset {
  @Prop({
    required: true,
  })
  id!: string;

  @Prop({
    required: true,
  })
  key!: string;

  @Prop({
    required: true,
  })
  originalName!: string;

  @Prop({
    required: true,
  })
  contentType!: string;

  @Prop({
    required: true,
  })
  size!: number;

  @Prop()
  etag?: string;

  @Prop({
    required: true,
  })
  uploadedAt!: Date;
}

export const FileAssetSchema = SchemaFactory.createForClass(FileAsset);

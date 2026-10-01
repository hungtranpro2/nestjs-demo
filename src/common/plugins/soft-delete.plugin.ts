import {
  type HydratedDocument,
  type Model,
  type MongooseQueryMiddleware,
  type Query,
  type Schema,
  type Types,
} from 'mongoose';

export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date | null;
}

export interface SoftDeleteModel<T extends SoftDeletable> extends Model<T> {
  softDeleteById(
    id: string | Types.ObjectId,
  ): Promise<HydratedDocument<T> | null>;
  restoreById(id: string | Types.ObjectId): Promise<HydratedDocument<T> | null>;
}

const queriesWithDeleted = new WeakSet<object>();

export function withDeleted<T extends object>(query: T): T {
  queriesWithDeleted.add(query);
  return query;
}

const queryMethods: MongooseQueryMiddleware[] = [
  'countDocuments',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndReplace',
  'findOneAndUpdate',
  'replaceOne',
  'updateMany',
  'updateOne',
];

export function softDeletePlugin<T extends SoftDeletable>(schema: Schema<T>) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  } as Parameters<typeof schema.add>[0]);

  schema.pre(queryMethods, function (this: Query<unknown, T>) {
    if (!queriesWithDeleted.has(this)) {
      this.where({ isDeleted: { $ne: true } });
    }
  });

  schema.pre('aggregate', function () {
    if (queriesWithDeleted.has(this)) {
      return;
    }

    const pipeline = this.pipeline();
    const activeDocumentsStage = {
      $match: { isDeleted: { $ne: true } },
    };
    const firstStage = pipeline[0];
    const mustRemainFirst =
      firstStage &&
      ('$geoNear' in firstStage ||
        '$search' in firstStage ||
        '$vectorSearch' in firstStage);

    pipeline.splice(mustRemainFirst ? 1 : 0, 0, activeDocumentsStage);
  });

  schema.statics.softDeleteById = async function (
    this: Model<T>,
    id: string | Types.ObjectId,
  ) {
    return this.findOneAndUpdate(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { returnDocument: 'after' },
    ).exec();
  };

  schema.statics.restoreById = async function (
    this: Model<T>,
    id: string | Types.ObjectId,
  ) {
    return withDeleted(
      this.findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1 } },
        { returnDocument: 'after' },
      ),
    ).exec();
  };
}

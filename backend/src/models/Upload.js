import "dotenv/config";
import fs from "fs";
import httpError from "http-errors";
import { Schema, model, Types, Document, Model } from "mongoose";
import { r2 } from "../libraries/r2.js";
import { join } from "path";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { uploadToDisk } from "../utils/uploadToDisk.js";

const uploadSchema = new Schema({
  key: {
    type: String,
    required: true,
  },

  mimetype: {
    type: String,
    required: true,
  },

  size: {
    type: Number,
    required: true,
  },

  url: {
    type: String,
    required: true,
  },

  useCase: { type: String, required: false },

  uploaderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

/* -------------------------------------------------------------------------- */
/*                              METHODS & STATICS                             */
/* -------------------------------------------------------------------------- */
uploadSchema.methods.deleteFile = async function () {
  try {
    if (this.url.includes("https")) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: this.key,
        }),
      );
    } else {
      await fs.promises.unlink(join(process.cwd(), "uploads", this.key));
    }

    await this.deleteOne();
  } catch (err) {
    console.log(err);
    throw httpError[500](`Error deleting file: ${this.key}`);
  }
};

uploadSchema.statics.uploadFile = async function ({
  path,
  buffer,
  key,
  mimetype,
  size,
  useCase,
  user,
}) {
  let url;

  try {
    if (process.env.NODE_ENV === "production") {
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: path ? fs.createReadStream(path) : buffer,
          ContentType: mimetype,
        }),
      );

      url = `${process.env.R2_PUBLIC_URL}/${key}`;
    } else {
      url = await uploadToDisk({
        key,
        buffer: buffer || (await fs.promises.readFile(path)),
      });
    }
  } catch (err) {
    console.log(err);
    throw httpError[500](`Error uploading your file`);
  }

  await this.updateOne(
    { uploaderId: user, key },
    {
      mimetype,
      size,
      useCase,
      url,
      uploadedAt: new Date(),
    },
    { upsert: true },
  );

  return { url, key };
};

uploadSchema.statics.deleteFile = async function (key) {
  const file = await this.findOne({ key });
  if (!file) {
    throw httpError[404]("File was not found");
  }

  await file.deleteFile();
};

/* -------------------------------------------------------------------------- */
/*                                   INDEXES                                  */
/* -------------------------------------------------------------------------- */
uploadSchema.index({ uploaderId: 1, key: 1 }, { unique: true });
uploadSchema.index({ useCase: 1 });

/* -------------------------------------------------------------------------- */
/*                                MODEL EXPORT                                */
/* -------------------------------------------------------------------------- */
const Upload = model("Upload", uploadSchema);
export default Upload;

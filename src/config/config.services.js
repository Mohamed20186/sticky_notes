import dotenv from "dotenv";
import { resolve } from "path";

const envFilePath = resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

dotenv.config({
  path: envFilePath,
});

export default {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL,
  saltRounds: Number(process.env.SALT_ROUNDS) || 10,
  encryptionKey: process.env.ENCRYPTION_KEY,
};

import bcrypt from "bcryptjs";
import configServices from "../../config/config.services.js";

export const hashPassword = (plainText) =>
  bcrypt.hash(String(plainText), configServices.saltRounds);

export const comparePassword = (plainText, hashed) =>
  bcrypt.compare(String(plainText), hashed);

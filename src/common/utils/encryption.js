import CryptoJS from "crypto-js";
import configServices from "../../config/config.services.js";

const getKey = () => {
  if (!configServices.encryptionKey) {
    throw new Error("ENCRYPTION_KEY is not set in the .env file");
  }
  return configServices.encryptionKey;
};

export const encrypt = (plainText) =>
  CryptoJS.AES.encrypt(String(plainText), getKey()).toString();

export const decrypt = (cipherText) =>
  CryptoJS.AES.decrypt(cipherText, getKey()).toString(CryptoJS.enc.Utf8);

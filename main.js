import express from "express";
import configServices from "./src/config/config.services.js";
import { notFoundHandler, globalErrorHandler } from "./src/common/index.js";
import { dbConnection } from "./src/database/connection.js";
import { userRouter, noteRouter } from "./src/module/index.js";

const app = express();

app.use(express.json());
await dbConnection();

app.use("/users", userRouter);
app.use("/notes", noteRouter);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "hello world",
  });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(configServices.port, () => {
  console.log(`the app is running in port ${configServices.port}`);
});

import { Router } from "express";
import { response } from "../../common/index.js";
import * as us from "./user.services.js";

export const userRouter = Router();

// POST /users/signup
userRouter.post("/signup", async (req, res, next) => {
  try {
    await us.signup(req.body);
    response(res, undefined, "User added successfully.", 201);
  } catch (error) {
    next(error);
  }
});

// POST /users/login
userRouter.post("/login", async (req, res, next) => {
  try {
    const user = await us.login(req.body);
    response(res, user, "Login successful", 200);
  } catch (error) {
    next(error);
  }
});

// PATCH /users/:id  (the id also works as a query param: PATCH /users?id=...)
userRouter.patch("/{:id}", async (req, res, next) => {
  try {
    await us.updateUser(req.params.id ?? req.query.id, req.body);
    response(res, undefined, "User updated", 200);
  } catch (error) {
    next(error);
  }
});

// DELETE /users?id=...
userRouter.delete("/", async (req, res, next) => {
  try {
    await us.deleteUser(req.query.id);
    response(res, undefined, "User deleted", 200);
  } catch (error) {
    next(error);
  }
});

// GET /users?id=...
userRouter.get("/", async (req, res, next) => {
  try {
    const user = await us.getUser(req.query.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

import { userModel } from "../../database/models/users.model.js";
import { noteModel } from "../../database/models/note.model.js";
import { AppError } from "../../common/index.js";
import {
  hashPassword,
  comparePassword,
  encrypt,
  getUserId,
} from "../../common/utils/index.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : email;

// 1. Signup (the email must not exist before)
export const signup = async ({ name, email, password, phone, age } = {}) => {
  email = normalizeEmail(email);

  if (email && (await userModel.exists({ email }))) {
    throw new AppError("Email already exists.", 409);
  }

  await userModel.create({
    name,
    email,
    // hash the password / encrypt the phone only when they were sent,
    // otherwise let mongoose report the "required" error
    password: password ? await hashPassword(password) : password,
    phone: phone ? encrypt(phone) : phone,
    age,
  });
};

// 2. Login (email + password from the body)
export const login = async ({ email, password } = {}) => {
  const invalid = new AppError("Invalid email or password", 401);

  if (!email || !password) throw invalid;

  const user = await userModel.findOne({ email: normalizeEmail(email) });
  if (!user || !(await comparePassword(password, user.password))) throw invalid;

  return { id: user._id, name: user.name, email: user.email };
};

// 3. Update logged-in user information (except the password)
export const updateUser = async (id, { name, email, phone, age } = {}) => {
  id = getUserId(id);

  const user = await userModel.findById(id);
  if (!user) throw new AppError("User not found", 404);

  if (email !== undefined) {
    email = normalizeEmail(email);
    if (email !== user.email) {
      const taken = await userModel.exists({ email, _id: { $ne: id } });
      if (taken) throw new AppError("Email already exists.", 409);
    }
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone ? encrypt(phone) : phone;
  if (age !== undefined) user.age = age;

  await user.save(); // runs the schema validators (age 18-60, required...)
};

// 4. Delete logged-in user (and the notes he owns, so none are left orphaned)
export const deleteUser = async (id) => {
  id = getUserId(id);

  const user = await userModel.findByIdAndDelete(id);
  if (!user) throw new AppError("User not found", 404);

  await noteModel.deleteMany({ userId: id });
};

// 5. Get logged-in user data by his id
export const getUser = async (id) => {
  id = getUserId(id);

  const user = await userModel.findById(id);
  if (!user) throw new AppError("User not found", 404);

  return user;
};

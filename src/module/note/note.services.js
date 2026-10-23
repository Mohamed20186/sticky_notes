import { noteModel } from "../../database/models/note.model.js";
import { userModel } from "../../database/models/users.model.js";
import { AppError } from "../../common/index.js";
import { getUserId, normlizeId } from "../../common/utils/index.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// finds the note and makes sure the logged-in user is its owner
const findOwnedNote = async (noteId, userId) => {
  const note = await noteModel.findById(noteId);
  if (!note) throw new AppError("Note not found", 404);
  if (note.userId.toString() !== userId) {
    throw new AppError("You are not the owner", 403);
  }
  return note;
};

// 1. Create a single note
export const createNote = async (userId, { title, content } = {}) => {
  userId = getUserId(userId);

  if (!(await userModel.exists({ _id: userId }))) {
    throw new AppError("User not found", 404);
  }

  await noteModel.create({ title, content, userId });
};

// 2. Update a single note by its id and return the updated note (owner only)
export const updateNote = async (noteId, userId, { title, content } = {}) => {
  userId = getUserId(userId);

  const note = await findOwnedNote(noteId, userId);

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;

  return await note.save(); // validators run here (custom title validator included)
};

// 3. Replace the entire note document with the body (owner only)
export const replaceNote = async (noteId, userId, { title, content, userId: newUserId } = {}) => {
  userId = getUserId(userId);

  const note = await findOwnedNote(noteId, userId);

  note.overwrite({
    title,
    content,
    userId: newUserId ?? note.userId,
    createdAt: note.createdAt,
  });

  return await note.save();
};

// 4. Update the title of all notes created by the logged-in user
export const updateAllTitles = async (userId, { title } = {}) => {
  userId = getUserId(userId);

  if (!title) throw new AppError("Title is required", 400);

  const result = await noteModel.updateMany(
    { userId },
    { title },
    { runValidators: true },
  );
  if (result.matchedCount === 0) throw new AppError("No note found", 404);
};

// 5. Delete a single note by its id and return the deleted note (owner only)
export const deleteNote = async (noteId, userId) => {
  userId = getUserId(userId);

  const note = await findOwnedNote(noteId, userId);
  await note.deleteOne();

  return note;
};

// 6. Paginated list of the user's notes, sorted by createdAt (newest first)
export const paginateSort = async (userId, { page, limit } = {}) => {
  userId = getUserId(userId);

  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.max(parseInt(limit, 10) || 10, 1);

  return await noteModel
    .find({ userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// 7. Get a note by its id (owner only)
export const getNoteById = async (noteId, userId) => {
  userId = getUserId(userId);

  return await findOwnedNote(noteId, userId);
};

// 8. Get a note of the logged-in user by its content
export const getNoteByContent = async (userId, content) => {
  userId = getUserId(userId);

  if (!content || typeof content !== "string") {
    throw new AppError("content is required in the query params", 400);
  }

  const note = await noteModel.findOne({ userId, content });
  if (!note) throw new AppError("No note found", 404);

  return note;
};

// 9. All notes of the logged-in user + user info (note: title, userId, createdAt / user: email)
export const getNotesWithUser = async (userId) => {
  userId = getUserId(userId);

  return await noteModel
    .find({ userId })
    .select("title userId createdAt")
    .populate({ path: "userId", select: "email -_id" })
    .lean();
};

// 10. Same thing using aggregation (user name + email) with search by title
export const aggregateNotes = async (userId, title) => {
  userId = getUserId(userId);

  const match = { userId: normlizeId(userId) };
  if (title && typeof title === "string") {
    match.title = { $regex: escapeRegex(title.trim()), $options: "i" };
  }

  return await noteModel.aggregate([
    { $match: match },
    {
      $lookup: {
        from: userModel.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        title: 1,
        userId: 1,
        createdAt: 1,
        user: { name: "$user.name", email: "$user.email" },
      },
    },
  ]);
};

// 11. Delete all notes of the logged-in user
export const deleteAllNotes = async (userId) => {
  userId = getUserId(userId);

  await noteModel.deleteMany({ userId });
};

import { Router } from "express";
import { response } from "../../common/index.js";
import * as ns from "./note.services.js";

export const noteRouter = Router();

// NOTE: the fixed paths (/all, /replace/:noteId, /paginate-sort, ...) are declared
// BEFORE the "/:noteId" routes, otherwise express would treat them as a note id.

// POST /notes?id=<userId>
noteRouter.post("/", async (req, res, next) => {
  try {
    await ns.createNote(req.query.id, req.body);
    response(res, undefined, "Note created", 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /notes/all?id=<userId>
noteRouter.patch("/all", async (req, res, next) => {
  try {
    await ns.updateAllTitles(req.query.id, req.body);
    response(res, undefined, "All notes updated", 200);
  } catch (error) {
    next(error);
  }
});

// PUT /notes/replace/:noteId?id=<userId>
noteRouter.put("/replace/:noteId", async (req, res, next) => {
  try {
    const note = await ns.replaceNote(req.params.noteId, req.query.id, req.body);
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
});

// GET /notes/paginate-sort?page=2&limit=3&id=<userId>
noteRouter.get("/paginate-sort", async (req, res, next) => {
  try {
    const notes = await ns.paginateSort(req.query.id, req.query);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
});

// GET /notes/note-by-content?content=...&id=<userId>
noteRouter.get("/note-by-content", async (req, res, next) => {
  try {
    const note = await ns.getNoteByContent(req.query.id, req.query.content);
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
});

// GET /notes/note-with-user?id=<userId>
noteRouter.get("/note-with-user", async (req, res, next) => {
  try {
    const notes = await ns.getNotesWithUser(req.query.id);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
});

// GET /notes/aggregate?title=...&id=<userId>
noteRouter.get("/aggregate", async (req, res, next) => {
  try {
    const notes = await ns.aggregateNotes(req.query.id, req.query.title);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
});

// DELETE /notes?id=<userId>  (all notes of the logged-in user)
noteRouter.delete("/", async (req, res, next) => {
  try {
    await ns.deleteAllNotes(req.query.id);
    response(res, undefined, "Deleted", 200);
  } catch (error) {
    next(error);
  }
});

// PATCH /notes/:noteId?id=<userId>
noteRouter.patch("/:noteId", async (req, res, next) => {
  try {
    const note = await ns.updateNote(req.params.noteId, req.query.id, req.body);
    res.status(200).json({ message: "updated", note });
  } catch (error) {
    next(error);
  }
});

// DELETE /notes/:noteId?id=<userId>
noteRouter.delete("/:noteId", async (req, res, next) => {
  try {
    const note = await ns.deleteNote(req.params.noteId, req.query.id);
    res.status(200).json({ message: "deleted", note });
  } catch (error) {
    next(error);
  }
});

// GET /notes/:noteId?id=<userId>
noteRouter.get("/:noteId", async (req, res, next) => {
  try {
    const note = await ns.getNoteById(req.params.noteId, req.query.id);
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
});

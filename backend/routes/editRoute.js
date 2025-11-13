import express from "express";
import { editImage } from "../controllers/editController.js";

const router = express.Router();

router.post("/", editImage);

export default router;

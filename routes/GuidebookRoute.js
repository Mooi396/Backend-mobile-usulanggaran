import express from "express";
import {
    createGuidebook,
    deleteGuidebook,
    getGuidebookById,
    getGuidebooks,
    updateGuidebook,
} from "../controllers/Guidebook.js";
import { allowRoles, superadminOnly, verifyUser } from "../middleware/AuthUser.js";
import { guidebookCategories } from "../services/guidebook.js";

const router = express.Router();
const guidebookReaders = allowRoles(...guidebookCategories);

router.get("/guidebooks", verifyUser, guidebookReaders, getGuidebooks);
router.get("/guidebooks/:id", verifyUser, guidebookReaders, getGuidebookById);
router.post("/guidebooks", verifyUser, superadminOnly, createGuidebook);
router.patch("/guidebooks/:id", verifyUser, superadminOnly, updateGuidebook);
router.delete("/guidebooks/:id", verifyUser, superadminOnly, deleteGuidebook);

export default router;

import express from "express";
import {
    createGuidebookSection,
    deleteGuidebookSection,
    getGuidebookSectionById,
    getSectionsByGuidebook,
    updateGuidebookSection,
} from "../controllers/GuidebookSection.js";
import { allowRoles, superadminOnly, verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

const GUIDEBOOK_ROLES = ["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"];
const guidebookReaders = allowRoles(...GUIDEBOOK_ROLES, "superadmin");

router.get("/guidebooks/:guidebookId/sections", verifyUser, guidebookReaders, getSectionsByGuidebook);
router.get("/guidebook-sections/:id", verifyUser, guidebookReaders, getGuidebookSectionById);
router.post("/guidebooks/:guidebookId/sections", verifyUser, superadminOnly, createGuidebookSection);
router.patch("/guidebook-sections/:id", verifyUser, superadminOnly, updateGuidebookSection);
router.delete("/guidebook-sections/:id", verifyUser, superadminOnly, deleteGuidebookSection);

export default router;
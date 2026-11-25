import express from "express";
import {
    createGuidebook,
    deleteGuidebook,
    getGuidebookById,
    getGuidebookImage,
    getGuidebooks,
    updateGuidebook,
} from "../controllers/Guidebook.js";
import { allowRoles, superadminOnly, verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

const GUIDEBOOK_ROLES = ["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"];
const guidebookReaders = allowRoles(...GUIDEBOOK_ROLES, "superadmin");

router.get("/guidebooks", verifyUser, guidebookReaders, getGuidebooks);
router.get("/guidebooks/:id", verifyUser, guidebookReaders, getGuidebookById);
router.get("/guidebooks/image/:filename", verifyUser, guidebookReaders, getGuidebookImage);

router.post("/guidebooks", verifyUser, superadminOnly, createGuidebook);
router.patch("/guidebooks/:id", verifyUser, superadminOnly, updateGuidebook);
router.delete("/guidebooks/:id", verifyUser, superadminOnly, deleteGuidebook);

export default router;
import Guidebooks from "../models/GuidebookModel.js";
import GuidebookSections from "../models/GuidebookSectionModel.js";
import path from "path";
import fs from "fs";

const ALLOWED_EXT = [".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 5000000; // 5 MB
const STORAGE_DIR = "./storage/guidebook";

const ensureStorageDir = () => {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
};

const saveSectionImage = async (file) => {
    const fileSize = file.data.length;
    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXT.includes(ext)) {
        const err = new Error("Format gambar harus JPG, JPEG, atau PNG");
        err.statusCode = 422;
        throw err;
    }

    if (fileSize > MAX_FILE_SIZE) {
        const err = new Error("Ukuran gambar maksimal 5 MB");
        err.statusCode = 422;
        throw err;
    }

    ensureStorageDir();
    const fileName = `sec-${file.md5}-${Date.now()}${ext}`;
    await file.mv(`${STORAGE_DIR}/${fileName}`);
    return fileName;
};

const removeSectionImage = (fileName) => {
    if (!fileName) return;
    const filePath = `${STORAGE_DIR}/${fileName}`;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const getSectionsByGuidebook = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findByPk(req.params.guidebookId);
        if (!guidebook) {
            return res.status(404).json({ msg: "Guidebook tidak ditemukan" });
        }

        const sections = await GuidebookSections.findAll({
            where: { guidebook_id: req.params.guidebookId },
            attributes: ["id", "guidebook_id", "urutan", "subjudul", "konten", "image", "createdAt", "updatedAt"],
            order: [
                ["urutan", "ASC"],
                ["id", "ASC"],
            ],
        });

        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getGuidebookSectionById = async (req, res) => {
    try {
        const section = await GuidebookSections.findByPk(req.params.id, {
            attributes: ["id", "guidebook_id", "urutan", "subjudul", "konten", "image", "createdAt", "updatedAt"],
        });

        if (!section) {
            return res.status(404).json({ msg: "Section guidebook tidak ditemukan" });
        }

        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createGuidebookSection = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findByPk(req.params.guidebookId);
        if (!guidebook) {
            return res.status(404).json({ msg: "Guidebook tidak ditemukan" });
        }

        const { subjudul, konten, urutan } = req.body || {};
        if (!subjudul || !konten) {
            return res.status(400).json({ msg: "Subjudul dan konten wajib diisi" });
        }

        let fileName = null;
        if (req.files && req.files.file) {
            fileName = await saveSectionImage(req.files.file);
        }

        const section = await GuidebookSections.create({
            guidebook_id: guidebook.id,
            urutan: Number(urutan) || 1,
            subjudul,
            konten,
            image: fileName,
        });

        res.status(201).json({
            msg: "Section guidebook berhasil ditambahkan",
            data: section,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const updateGuidebookSection = async (req, res) => {
    try {
        const section = await GuidebookSections.findByPk(req.params.id);
        if (!section) {
            return res.status(404).json({ msg: "Section guidebook tidak ditemukan" });
        }

        const urutan = req.body?.urutan !== undefined ? Number(req.body.urutan) : section.urutan;
        const subjudul = req.body?.subjudul ?? section.subjudul;
        const konten = req.body?.konten ?? section.konten;

        if (!subjudul || !konten) {
            return res.status(400).json({ msg: "Subjudul dan konten wajib diisi" });
        }

        let fileName = section.image;

        // Opsional: hapus gambar lama tanpa ganti gambar baru jika hapus_gambar bernilai "true" / true
        if (req.body?.hapus_gambar === "true" || req.body?.hapus_gambar === true) {
            removeSectionImage(section.image);
            fileName = null;
        }

        if (req.files && req.files.file) {
            const newFileName = await saveSectionImage(req.files.file);
            removeSectionImage(section.image);
            fileName = newFileName;
        }

        await section.update({
            urutan,
            subjudul,
            konten,
            image: fileName,
        });

        res.status(200).json({
            msg: "Section guidebook berhasil diupdate",
            data: section,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const deleteGuidebookSection = async (req, res) => {
    try {
        const section = await GuidebookSections.findByPk(req.params.id);
        if (!section) {
            return res.status(404).json({ msg: "Section guidebook tidak ditemukan" });
        }

        removeSectionImage(section.image);
        await section.destroy();

        res.status(200).json({ msg: "Section guidebook berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
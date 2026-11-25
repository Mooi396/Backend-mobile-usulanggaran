import Guidebooks from "../models/GuidebookModel.js";
import GuidebookSections from "../models/GuidebookSectionModel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED_ROLES = ["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"];
const ALLOWED_EXT = [".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 5000000; // 5 MB
const STORAGE_DIR = "./storage/guidebook";

const ensureStorageDir = () => {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
};

const getUploadedFile = (files, ...fieldNames) => {
    if (!files) return null;
    for (const name of fieldNames) {
        if (files[name]) return files[name];
    }
    return null;
};

const saveImageFile = async (file, prefix = "") => {
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
    const fileName = `${prefix}${file.md5}-${Date.now()}${ext}`;
    await file.mv(`${STORAGE_DIR}/${fileName}`);
    return fileName;
};

const removeImageFile = (fileName) => {
    if (!fileName) return;
    const filePath = `${STORAGE_DIR}/${fileName}`;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const parseSectionsInput = (rawSections) => {
    if (rawSections === undefined || rawSections === null || rawSections === "") {
        return [];
    }

    let parsed = rawSections;
    if (typeof rawSections === "string") {
        try {
            parsed = JSON.parse(rawSections);
        } catch {
            const err = new Error("Format JSON pada sections tidak valid");
            err.statusCode = 400;
            throw err;
        }
    }

    if (!Array.isArray(parsed)) {
        const err = new Error("Format sections harus berupa array");
        err.statusCode = 400;
        throw err;
    }

    return parsed.map((sec, idx) => {
        if (!sec || !sec.subjudul || !sec.konten) {
            const err = new Error(`Section ke-${idx + 1} wajib memiliki subjudul dan konten`);
            err.statusCode = 400;
            throw err;
        }
        return {
            urutan: Number(sec.urutan) || idx + 1,
            subjudul: String(sec.subjudul).trim(),
            konten: String(sec.konten).trim(),
            keepImage: sec.image || null,
        };
    });
};

export const getGuidebooks = async (req, res) => {
    try {
        let whereCondition = {};

        if (req.role && ALLOWED_ROLES.includes(req.role)) {
            whereCondition = { role: req.role };
        } else if (req.query?.role && ALLOWED_ROLES.includes(req.query.role)) {
            whereCondition = { role: req.query.role };
        }

        const response = await Guidebooks.findAll({
            where: whereCondition,
            attributes: ["id", "judul", "image", "url", "kesimpulan", "role", "createdAt", "updatedAt"],
            include: [
                {
                    model: GuidebookSections,
                    as: "sections",
                    attributes: ["id", "urutan", "subjudul", "konten", "image"],
                },
            ],
            order: [
                ["id", "DESC"],
                [{ model: GuidebookSections, as: "sections" }, "urutan", "ASC"],
            ],
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const getGuidebookById = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findOne({
            where: { id: req.params.id },
            attributes: ["id", "judul", "image", "url", "kesimpulan", "role", "createdAt", "updatedAt"],
            include: [
                {
                    model: GuidebookSections,
                    as: "sections",
                    attributes: ["id", "urutan", "subjudul", "konten", "image"],
                },
            ],
            order: [[{ model: GuidebookSections, as: "sections" }, "urutan", "ASC"]],
        });

        if (!guidebook) {
            return res.status(404).json({ msg: "Guidebook tidak ditemukan" });
        }

        res.status(200).json(guidebook);
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const getGuidebookImage = async (req, res) => {
    try {
        const { filename } = req.params;
        const safeName = path.basename(filename);
        const filePath = path.join(__dirname, "../storage/guidebook", safeName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: "Gambar tidak ditemukan" });
        }

        const inGuidebook = await Guidebooks.findOne({ where: { image: safeName } });
        const inSection = await GuidebookSections.findOne({ where: { image: safeName } });

        if (!inGuidebook && !inSection) {
            return res.status(404).json({ msg: "Data gambar guidebook tidak ditemukan" });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createGuidebook = async (req, res) => {
    try {
        const { judul, role, kesimpulan, sections } = req.body || {};

        if (!judul || !role) {
            return res.status(400).json({ msg: "Judul dan role wajib diisi" });
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(422).json({
                msg: `Role tidak valid. Pilihan yang diperbolehkan: ${ALLOWED_ROLES.join(", ")}`,
            });
        }

        const parsedSections = parseSectionsInput(sections);

        let mainImageName = null;
        let url = null;
        const mainFile = getUploadedFile(req.files, "image", "file");
        if (mainFile) {
            mainImageName = await saveImageFile(mainFile, "main-");
            url = `${req.protocol}://${req.get("host")}/storage/guidebook/${mainImageName}`;
        }

        const createdSectionsPayload = [];
        for (let i = 0; i < parsedSections.length; i++) {
            const sec = parsedSections[i];
            const sectionFile = getUploadedFile(req.files, `section_${i}_image`, `section_${i}_file`);
            let sectionImageName = null;

            if (sectionFile) {
                sectionImageName = await saveImageFile(sectionFile, `sec${i}-`);
            }

            createdSectionsPayload.push({
                urutan: sec.urutan,
                subjudul: sec.subjudul,
                konten: sec.konten,
                image: sectionImageName,
            });
        }

        const newGuidebook = await Guidebooks.create(
            {
                judul: String(judul).trim(),
                image: mainImageName,
                url,
                kesimpulan: kesimpulan !== undefined && kesimpulan !== "" ? kesimpulan : null,
                role,
                sections: createdSectionsPayload,
            },
            {
                include: [{ model: GuidebookSections, as: "sections" }],
            }
        );

        res.status(201).json({
            msg: "Guidebook berhasil dibuat",
            data: newGuidebook,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const updateGuidebook = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findByPk(req.params.id, {
            include: [{ model: GuidebookSections, as: "sections" }],
        });

        if (!guidebook) {
            return res.status(404).json({ msg: "Guidebook tidak ditemukan" });
        }

        const judul = req.body?.judul !== undefined ? String(req.body.judul).trim() : guidebook.judul;
        const role = req.body?.role ?? guidebook.role;
        const kesimpulan = req.body?.kesimpulan !== undefined ? req.body.kesimpulan : guidebook.kesimpulan;

        if (!judul || !role) {
            return res.status(400).json({ msg: "Judul dan role wajib diisi" });
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(422).json({
                msg: `Role tidak valid. Pilihan yang diperbolehkan: ${ALLOWED_ROLES.join(", ")}`,
            });
        }

        let mainImageName = guidebook.image;
        let url = guidebook.url;

        if (req.body?.hapus_gambar === "true" || req.body?.hapus_gambar === true) {
            removeImageFile(guidebook.image);
            mainImageName = null;
            url = null;
        }

        const mainFile = getUploadedFile(req.files, "image", "file");
        if (mainFile) {
            const newMainImage = await saveImageFile(mainFile, "main-");
            removeImageFile(guidebook.image);
            mainImageName = newMainImage;
            url = `${req.protocol}://${req.get("host")}/storage/guidebook/${mainImageName}`;
        }

        await guidebook.update({ judul, image: mainImageName, url, kesimpulan, role });

        if (req.body?.sections !== undefined) {
            const parsedSections = parseSectionsInput(req.body.sections);
            const oldSections = guidebook.sections || [];
            const oldImages = oldSections.map((s) => s.image).filter(Boolean);
            const nextSectionRows = [];

            for (let i = 0; i < parsedSections.length; i++) {
                const sec = parsedSections[i];
                const sectionFile = getUploadedFile(req.files, `section_${i}_image`, `section_${i}_file`);
                let sectionImageName = sec.keepImage;

                if (sectionFile) {
                    sectionImageName = await saveImageFile(sectionFile, `sec${i}-`);
                }

                nextSectionRows.push({
                    guidebook_id: guidebook.id,
                    urutan: sec.urutan,
                    subjudul: sec.subjudul,
                    konten: sec.konten,
                    image: sectionImageName,
                });
            }

            const keptImages = new Set(nextSectionRows.map((s) => s.image).filter(Boolean));
            for (const oldImg of oldImages) {
                if (!keptImages.has(oldImg)) {
                    removeImageFile(oldImg);
                }
            }

            await GuidebookSections.destroy({ where: { guidebook_id: guidebook.id } });
            if (nextSectionRows.length > 0) {
                await GuidebookSections.bulkCreate(nextSectionRows);
            }
        }

        const updated = await Guidebooks.findByPk(req.params.id, {
            include: [{ model: GuidebookSections, as: "sections" }],
            order: [[{ model: GuidebookSections, as: "sections" }, "urutan", "ASC"]],
        });

        res.status(200).json({ msg: "Guidebook berhasil diupdate", data: updated });
    } catch (error) {
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

export const deleteGuidebook = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findByPk(req.params.id, {
            include: [{ model: GuidebookSections, as: "sections" }],
        });

        if (!guidebook) {
            return res.status(404).json({ msg: "Guidebook tidak ditemukan" });
        }

        removeImageFile(guidebook.image);
        for (const sec of guidebook.sections || []) {
            removeImageFile(sec.image);
        }

        await guidebook.destroy();

        res.status(200).json({ msg: "Guidebook berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
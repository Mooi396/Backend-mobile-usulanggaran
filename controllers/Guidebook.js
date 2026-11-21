import Guidebooks from "../models/GuidebookModel.js";
import { guidebookScope, validateGuidebookInput } from "../services/guidebook.js";

export const getGuidebooks = async (req, res) => {
    try {
        const guidebooks = await Guidebooks.findAll({
            where: guidebookScope(req.role),
            order: [["id", "DESC"]],
        });
        res.status(200).json(guidebooks);
    } catch (error) {
        res.status(error.status || 500).json({ msg: error.message });
    }
};

export const getGuidebookById = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findOne({
            where: { id: req.params.id, ...guidebookScope(req.role) },
        });
        if (!guidebook) return res.status(404).json({ msg: "Guidebook tidak ditemukan." });
        res.status(200).json(guidebook);
    } catch (error) {
        res.status(error.status || 500).json({ msg: error.message });
    }
};

export const createGuidebook = async (req, res) => {
    const { data, error } = validateGuidebookInput(req.body);
    if (error) return res.status(400).json({ msg: error });

    try {
        const guidebook = await Guidebooks.create(data);
        res.status(201).json({ msg: "Guidebook berhasil ditambahkan.", data: guidebook });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateGuidebook = async (req, res) => {
    const { data, error } = validateGuidebookInput(req.body, { partial: true });
    if (error) return res.status(400).json({ msg: error });
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ msg: "Tidak ada data guidebook yang diperbarui." });
    }

    try {
        const guidebook = await Guidebooks.findByPk(req.params.id);
        if (!guidebook) return res.status(404).json({ msg: "Guidebook tidak ditemukan." });
        await guidebook.update(data);
        res.status(200).json({ msg: "Guidebook berhasil diperbarui.", data: guidebook });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteGuidebook = async (req, res) => {
    try {
        const guidebook = await Guidebooks.findByPk(req.params.id);
        if (!guidebook) return res.status(404).json({ msg: "Guidebook tidak ditemukan." });
        await guidebook.destroy();
        res.status(200).json({ msg: "Guidebook berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

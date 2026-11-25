import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Guidebooks from "./GuidebookModel.js";

const { DataTypes } = Sequelize;

const GuidebookSections = db.define(
    "guidebook_section",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        guidebook_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Guidebooks,
                key: "id",
            },
            onDelete: "CASCADE",
        },
        urutan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        subjudul: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        konten: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true, // setiap subjudul boleh punya gambar atau tidak
        },
    },
    {
        freezeTableName: true,
    }
);

Guidebooks.hasMany(GuidebookSections, {
    foreignKey: "guidebook_id",
    as: "sections",
    onDelete: "CASCADE",
});

GuidebookSections.belongsTo(Guidebooks, {
    foreignKey: "guidebook_id",
    as: "guidebook",
});

export default GuidebookSections;
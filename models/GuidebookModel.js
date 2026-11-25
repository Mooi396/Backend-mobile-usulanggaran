import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Guidebooks = db.define(
    "guidebook",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        judul: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true, // opsional jika hanya ingin gambar per subjudul
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        kesimpulan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"]],
            },
        },
    },
    {
        freezeTableName: true,
    }
);

export default Guidebooks;
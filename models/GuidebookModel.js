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
        gambar: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        kategori: {
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

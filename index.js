import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import session from "express-session";
import SequelizeStore from "connect-session-sequelize";
import FileUpload from "express-fileupload";

// Import Routes
import AkunRoute from "./routes/AkunRoute.js";
import AnggaranRoute from "./routes/AnggaranRoute.js";
import IkuRoute from "./routes/IkuRoute.js";
import JenisBelanjaRoute from "./routes/JenisBelanjaRoute.js";
import KegiatanRoute from "./routes/KegiatanRoute.js";
import KomponenRoute from "./routes/KomponenRoute.js";
import MasterKomponenRoute from "./routes/MasterKomponenRoute.js";
import MasterOutputRoute from "./routes/MasterOutputRoute.js";
import MasterPaguRoute from "./routes/MasterPaguRoute.js";
import MasterSatuanRoute from "./routes/MasterSatuanRoute.js";
import MasterSubkomponenRoute from "./routes/MasterSubkomponenRoute.js";
import MasterSuboutputRoute from "./routes/MasterSuboutputRoute.js";
import OperatorRoute from "./routes/OperatorRoute.js";
import OutputRoute from "./routes/OutputRoute.js";
import PaguRoute from "./routes/PaguRoute.js";
import PengajuanRoute from "./routes/PengajuanRoute.js";
import ProgramRoute from "./routes/ProgramRoute.js";
import SubkomponenRoute from "./routes/SubKomponenRoute.js";
import SuboutputRoute from "./routes/SuboutputRoute.js";
import UnitKerjaRoute from "./routes/UnitKerjaRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js";
import AuditLogRoute from "./routes/AuditLogRoute.js";
import GuidebookRoute from "./routes/GuidebookRoute.js";
import GuidebookSectionRoute from "./routes/GuidebookSectionRoute.js";

import db from "./config/Database.js";
import UnitKerjas from "./models/UnitKerjaModel.js";
import { fillOfficialUnitCodes } from "./services/unitCodes.js";
import { auditManagement } from "./services/auditLog.js";

const app = express();
const SequelizeStoreSession = SequelizeStore(session.Store);

const store = new SequelizeStoreSession({
  db: db,
});

// --- MIDDLEWARE ---
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use(FileUpload());
app.use(express.json());
app.use("/storage", express.static("storage"));

app.use(auditManagement);

// --- ROUTES ---
app.use(AuditLogRoute);
app.use(AkunRoute);
app.use(AnggaranRoute);
app.use(IkuRoute);
app.use(JenisBelanjaRoute);
app.use(KegiatanRoute);
app.use(KomponenRoute);
app.use(MasterKomponenRoute);
app.use(MasterOutputRoute);
app.use(MasterPaguRoute);
app.use(MasterSatuanRoute);
app.use(MasterSubkomponenRoute);
app.use(MasterSuboutputRoute);
app.use(OperatorRoute);
app.use(OutputRoute);
app.use(PaguRoute);
app.use(PengajuanRoute);
app.use(ProgramRoute);
app.use(SubkomponenRoute);
app.use(SuboutputRoute);
app.use(UnitKerjaRoute);
app.use(DashboardRoute);
app.use(GuidebookRoute);
app.use(GuidebookSectionRoute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ups! Endpoint API atau rute tidak ditemukan.",
  });
});

// --- SERVER START & DATABASE CONNECTION ---
const PORT = process.env.PORT || process.env.APP_PORT || 5000;

(async () => {
  try {
    await db.authenticate();
    console.log("Database connected...");

    // Sinkronisasi session store
    await store.sync();

    // Sinkronisasi database model
    await db.sync({ alter: true });
    await fillOfficialUnitCodes(UnitKerjas);
    console.log("Database synchronized successfully.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect database or start server:", error);
  }
})();
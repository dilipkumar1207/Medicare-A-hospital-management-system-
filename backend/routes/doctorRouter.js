import express from 'express';
import multer from 'multer';
import {
  createDoctor,
  getDoctors,
  loginDoctor,
  getDoctorById,
  updateDoctor,
  toggleDoctorAvailability,
  deleteDoctor
} from "../controllers/doctorController.js";
import doctorAuth from '../middlewares/doctorAuth.js';

const upload = multer({ dest: '/tmp'});

const doctorRouter = express.Router();

doctorRouter.get("/", getDoctors);
//doctorRouter.post('/login', loginDoctor);
doctorRouter.post('/login', (req, res, next) => {
    console.log("🔥 DOCTOR LOGIN ROUTE HIT");
    loginDoctor(req, res, next);
});

doctorRouter.get("/:id", getDoctorById);
doctorRouter.post("/", upload.single('image'), createDoctor);

//after login
doctorRouter.put("/:id", doctorAuth, upload.single('image'), updateDoctor);
doctorRouter.post("/:id/toggle-availability", doctorAuth, toggleDoctorAvailability);
doctorRouter.delete("/:id", deleteDoctor);

export default doctorRouter;
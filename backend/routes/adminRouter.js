import express from "express";

const adminRouter = express.Router();

adminRouter.post("/login", (req, res) => {
    const { email, password } = req.body;

    console.log("========== ADMIN LOGIN ==========");
    console.log("Entered Email:", email);
    console.log("Entered Password:", password);
    console.log("ENV Email:", process.env.ADMIN_EMAIL);
    console.log("ENV Password:", process.env.ADMIN_PASSWORD);
    console.log("=================================");

    if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
    ) {
        return res.json({
            success: true,
            token: "admin-token",
        });
    }

    return res.json({
        success: false,
        message: "Invalid Credentials",
    });
});

export default adminRouter;
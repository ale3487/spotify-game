import express from "express";
import { loginSpotify,  getMe, TopUser } from "../controllers/spotify.controller.js";
import { authenticate } from "../service/coockies.js";

const router = express.Router();

// 1. Endpoint pubblico (non serve essere loggati per farlo)
router.post("/login", loginSpotify);

// Questo permetterà a getMe di leggere req.user
router.get("/me", authenticate, getMe);

router.get("/TopUser", authenticate, TopUser);

export default router;
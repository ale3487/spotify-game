/**
 * @file cookies.js
 * @description Middleware di autenticazione per Express.
 * Verifica la validità del JSON Web Token (JWT) contenuto nei cookie HttpOnly.
 * Se valido, inietta i dati dell'utente nell'oggetto 'req' per i controller successivi.
 */

import jwt from "jsonwebtoken";

/**
 * Middleware di protezione delle rotte.
 * Controlla la presenza e l'integrità del 'session_token'.
 * * @param {import('express').Request} req - Oggetto richiesta Express.
 * @param {import('express').Response} res - Oggetto risposta Express.
 * @param {import('express').NextFunction} next - Funzione per passare al middleware successivo.
 */
export const authenticate = (req, res, next) => {
  // Estrazione del token dai cookie (richiede cookie-parser configurato in index.js)
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ 
      error: "Accesso negato. Sessione mancante o scaduta." 
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    
    /**
     * Verifica del token. Se il segreto non corrisponde o il token è scaduto,
     * jwt.verify lancerà un'eccezione catturata dal blocco catch.
     */
    const decoded = jwt.verify(token, secret);

    /**
     * Iniezione dei dati utente (es. spotifyId, display_name) nella richiesta.
     * Questo permette a rotte come /TopUser di sapere chi sta facendo la richiesta
     * tramite req.user.id senza dover ri-decodificare il token.
     */
    req.user = decoded;

    // Prosegue verso il controller della rotta
    next();
  } catch (err) {
    console.error("[AUTH MIDDLEWARE] Validazione JWT fallita:", err.message);
    
    return res.status(401).json({ 
      error: "Sessione non valida. Effettua nuovamente il login." 
    });
  }
};
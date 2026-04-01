import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  // 1. Estraiamo il cookie dal pacchetto delle richieste
  const token = req.cookies.session_token;

  // 2. Se il cookie non c'è, l'utente non è loggato
  if (!token) {
    return res.status(401).json({ error: "Accesso negato. Sessione mancante." });
  }

  try {
    // 3. Verifichiamo se il token è valido e non è scaduto
    // Usa lo stesso JWT_SECRET che hai usato nella funzione loginSpotify
    const secret = process.env.JWT_SECRET
    const decoded = jwt.verify(token, secret);

    // 4. Attacchiamo i dati dell'utente (id, nome, email) alla richiesta (req.user)
    // Così le funzioni successive (come TopArtists) possono usarli
    req.user = decoded;

    // 5. Passiamo al "prossimo" pezzo di codice (la tua funzione finale)
    next();
  } catch (err) {
    // Se il token è manomesso o scaduto
    return res.status(401).json({ error: "Sessione scaduta o non valida." });
  }
};
# beatmatch 

Questo progetto è composto da un'applicazione **Frontend** e un server **Backend**. Segui i passaggi indicati di seguito per configurare l'ambiente ed avviare l'applicazione correttamente.

---

## Requisiti Preliminari

Insieme al progetto, hai ricevuto un archivio `.zip` contenente i file di configurazione necessari. Assicurati di averlo a portata di mano. All'interno troverai:
* Cartella `frontend/` contenente il file `.env`
* Cartella `backend/` contenente il file `.env` e le credenziali per i privilegi di amministratore di **Firebase**.

---

## Installazione e Configurazione

1. **Inserimento dei file di configurazione:**
   * Copia il file `.env` (presente nella cartella `frontend` dello ZIP) all'interno della cartella **frontend** del progetto principale.
   * Copia i file presenti nella cartella `backend` dello ZIP (incluso il file `.env` e i file delle credenziali Firebase) all'interno della cartella **backend** del progetto principale.

2. **Installazione delle dipendenze:**
   Apri due terminali separati, uno posizionato sulla cartella del frontend e uno sulla cartella del backend, ed esegui in entrambi il comando:
   ```bash
   npm install
   
## Avvio dell'Applicazione
Sempre mantenendo i due terminali separati, esegui i seguenti comandi per avviare i servizi:

Frontend
Nel terminale dedicato al frontend, compila il progetto e avvia l'anteprima:
```bash
npm run build
npm run preview
```


Backend
Nel terminale dedicato al backend, avvia il server Node.js:
```bash
node server.js
```

## Autenticazione e Accesso
Per accedere all'applicazione, segui questi passaggi:

1. Utilizza l'indirizzo email che hai condiviso con me (e che è stato abilitato all'interno della dashboard Spotify for Developers).
2. Inserisci l'email nella schermata di login dell'applicazione.
3. Verrà inviato un codice di verifica a quell'indirizzo: inseriscilo per completare l'accesso.

Note Importanti per il Testing
Account Spotify Premium vs Free: L'applicazione supporta entrambe le tipologie di account. 
Tuttavia, se si utilizza un account Free (non Premium), il player musicale nella classifica e nel gioco non si avvierà a causa delle limitazioni native delle API di Spotify.

Test del Gioco: Per testare correttamente le funzionalità del gioco utilizzando lo stesso account, 
ti consigliamo di effettuare il secondo accesso aprendo una finestra in modalità privata (navigazione in incognito).

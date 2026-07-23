/* =========================================================
   CONFIG.JS
   -----------------------------------------------------------
   This is the ONLY file you should need to edit to get the
   site running with your own Google account, Apps Script
   deployment, and candidates. See SETUP_GUIDE.md for the
   full step-by-step walkthrough.
   ========================================================= */

const CONFIG = {

  // 1) Replace this with your actual Firebase config object
  //    found in your Firebase Project Settings > General > Your apps.
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyAuM29zEj6hXtWjANnuNUFSBLv8GKQtzlo",
  authDomain: "voteing-bf34c.firebaseapp.com",
  projectId: "voteing-bf34c",
  storageBucket: "voteing-bf34c.firebasestorage.app",
  messagingSenderId: "629775256044",
  appId: "1:629775256044:web:39b886b590137b74fe98c9",
  measurementId: "G-QJ9Q2D5ZEF"
  },

  // 2) Paste the URL you get after deploying the Apps Script as a
  //    Web App (Deploy > New deployment > Web app). It looks like:
  //    https://script.google.com/macros/s/XXXXXXXXXXXX/exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwK5QW1u3-Ujk7ZjKinXzs6i46ONIsJYg7xCJLM7bg622n2kB9UCZTA-IjHq3_O6OfPZw/exec",

  // 3) How often (ms) the live results are refreshed.
  // Increased to 15 seconds to support up to 10k concurrent users smoothly
  REFRESH_INTERVAL_MS: 15000,

  // 4) Candidates. "id" must match what you store in the sheet.
  //    "image" can be any public image URL or a local path.
  CANDIDATES: [
    {
      id: "C1",
      name: "المشارك سعود ذعار السهلي",
      image: "allimg/1.jpeg"
    },
    {
      id: "C2",
      name: "المشارك مبارك ملفي بن عزاره الحربي",
      image: "allimg/2.jpeg"
    },
    {
      id: "C3",
      name: "المشارك ناصر جمعان بن لحيان العازمي ",
      image: "allimg/3.jpeg"
    }
  ],

  // 5) Static vote offsets (base counts added to live data)
  // These numbers are added to the votes fetched from the sheet.
  // Note: C1 and C2 were both mentioned in the prompt, please swap their values if needed.
  STATIC_VOTES: {
    "C1": 4613,
    "C2": 41958,
    "C3": 46996
  }
};

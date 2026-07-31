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
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby2MhreiyBgmbZqvb4UepoM6gBY6wwFH4K1Me0w9al3ZlgRFWxTsiaOCGWmRwGHN-drhw/exec",

  // 3) How often (ms) the live results are refreshed.
  // Increased to 15 seconds to support up to 10k concurrent users smoothly
  REFRESH_INTERVAL_MS: 15000,

  // 4) Candidates. "id" must match what you store in the sheet.
  //    "image" can be any public image URL or a local path.
  CANDIDATES: [
    {
      id: "CS1",
      name: "  المشارك / طلال نزال العازمي",
      image: "allimg/1.jpeg"
    },
    {
      id: "CS2",
      name: "المشارك / عيسى العازمي",
      image: "allimg/2.jpeg"
    },
    {
      id: "CS3",
      name: "المشارك / مبارك ملفي بن عزازة الحربي ",
      image: "allimg/3.jpeg"
    },
    {
      id: "CS4",
      name: "المشارك / نايل الخريم المساعرة ",
      image: "allimg/4.jpeg"
    }
  ],


};

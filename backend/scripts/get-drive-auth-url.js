const { getAuthUrl } = require("../services/googleDriveOAuth");

// scripts/get-drive-auth-url.js
require("dotenv").config({ path: "./backend/.env" });
// const { getAuthUrl } = require("../routes/");

console.log("Auth URL:");
console.log(getAuthUrl());

/**
 * THIS FILE HELPS YOU CHANGE THE PASSWORD FOR THE ADMIN.
 * MAKE SURE YOU FOLLOW BELOW STEPSs
 *
 * USE VS-CODE IF POSSIBLE
 */

const bcrypt = require("bcrypt");
const { question } = require("readline-sync");

/**
 * STEP 1 - OPEN TERMINAL USING CTRL+` OR  GO TO MENUBAR > ... > TERMINAL> NEW TERMINAL
 */

/**
 * STEP 2 - RUN THIS COMMAND IN TERMINAL := node changePassword.js
 */
const generatePassword = async () => {
  try {
    const password = question(":>> Enter your password := ");
    hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    console.log(":>> hashed password := ", hashedPassword);
  } catch (error) {
    console.error(error);
  }
};
generatePassword();

/**
 * STEP 3 - COPY THE HASHED PASSWORD AND PASTE IT IN .ENV FILE AS:
 * PASSWORD = YOUR HASHED PASSWORD
 */

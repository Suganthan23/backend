require('dotenv').config(); 
const { encrypt, decrypt } = require('./src/utils/encryption');

const secret = "MySuperSecretPassword";
console.log("Original:", secret);

const { iv, encryptedData } = encrypt(secret);
console.log("Encrypted (Garbage):", encryptedData);
console.log("IV:", iv);

const original = decrypt(encryptedData, iv);
console.log("Decrypted:", original);

if (secret === original) {
    console.log("✅ SUCCESS: Encryption works!");
} else {
    console.log("❌ FAILURE: Math is broken.");
}
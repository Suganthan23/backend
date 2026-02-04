process.env.ENCRYPTION_KEY = "0000000000000000000000000000000000000000000000000000000000000000"; 
const { encrypt, decrypt } = require('./encryption');

describe('Encryption Engine', () => {

    test('should encrypt and decrypt correctly', () => {
        const password = "MySecretPassword123!";

        const result = encrypt(password);

        expect(result).toHaveProperty('iv');
        expect(result).toHaveProperty('encryptedData');
        expect(result.encryptedData).not.toBe(password); 

        const original = decrypt(result.encryptedData, result.iv);
        expect(original).toBe(password); 
    });

    test('should produce different outputs for same input (Random IV)', () => {
        const password = "SamePassword";

        const result1 = encrypt(password);
        const result2 = encrypt(password);

        expect(result1.iv).not.toBe(result2.iv);
        expect(result1.encryptedData).not.toBe(result2.encryptedData);
    });

});
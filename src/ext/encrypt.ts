import crypto from 'crypto';
import fs from 'fs/promises';
import { ReadConfig } from '../config';

export async function EncryptData(token: string): Promise<string> {
    const config = await ReadConfig();
    const publicKey = await fs.readFile(config.key.dir, 'utf-8');
    const encryptData = await crypto.publicEncrypt(publicKey, Buffer.from(token, 'base64'));
    return encryptData.toString('base64');
}
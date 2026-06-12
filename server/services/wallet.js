require('dotenv').config();
const EC = require('elliptic').ec;
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ec = new EC('secp256k1');
const WALLET_FILE = path.join(__dirname, '..', '..', 'data', 'wallet.json');
const TRONGRID_API = 'https://api.trongrid.io';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

let wallet = null;

function base58Encode(bytes) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + bytes.toString('hex'));
    let encoded = '';
    while (num > 0n) {
        encoded = ALPHABET[Number(num % 58n)] + encoded;
        num = num / 58n;
    }
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
        encoded = '1' + encoded;
    }
    return encoded;
}

function generateWallet() {
    const key = ec.genKeyPair();
    const privHex = key.getPrivate('hex');
    const pubKey = key.getPublic();
    const pubBytes = Buffer.from(pubKey.encode('hex', false), 'hex');
    
    const shaHash = crypto.createHash('sha256').update(pubBytes).digest();
    const ripemd160 = crypto.createHash('ripemd160').update(shaHash).digest();
    
    const addrBytes = Buffer.concat([Buffer.from([0x41]), ripemd160]);
    
    const hash1 = crypto.createHash('sha256').update(addrBytes).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const fullAddr = Buffer.concat([addrBytes, hash2.subarray(0, 4)]);
    
    const base58Addr = base58Encode(fullAddr);
    // TRON addresses start with T (the 0x41 prefix becomes 'T' in base58)
    const address = 'T' + base58Addr.substring(1);
    
    return { privateKey: privHex, address };
}

function loadOrCreateWallet() {
    if (fs.existsSync(WALLET_FILE)) {
        const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
        wallet = data;
        console.log(`💼 Wallet loaded: ${wallet.address}`);
    } else {
        wallet = generateWallet();
        fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2));
        console.log(`🔑 New wallet created: ${wallet.address}`);
        console.log(`⚠️  SAVE THIS PRIVATE KEY: ${wallet.privateKey}`);
        console.log(`   (stored in data/wallet.json)`);
    }
    return wallet;
}

function getAddress() {
    if (!wallet) loadOrCreateWallet();
    return wallet.address;
}

async function checkUSDTBalance(address) {
    try {
        // Use triggercontract to check USDT balance
        // Pad address to 64 hex chars (remove 0x prefix, pad left with zeros)
        const addrHex = addressToHex(address);
        
        const triggerRes = await axios.post(`${TRONGRID_API}/wallet/triggersmartcontract`, {
            contract_address: USDT_CONTRACT,
            function_selector: 'balanceOf(address)',
            parameter: addrHex.replace('0x', '').padStart(64, '0'),
            visible: true
        }, { timeout: 15000 });
        
        if (triggerRes.data.constant_result?.[0]) {
            const hex = triggerRes.data.constant_result[0];
            const value = BigInt('0x' + hex);
            return { usdt: Number(value) / 1e6 };
        }
        return { usdt: 0 };
    } catch (e) {
        console.error('Balance check error:', e.message);
        // Retry with alternative approach
        try {
            const acctRes = await axios.get(`${TRONGRID_API}/v1/accounts/${address}`, { timeout: 10000 });
            const tokens = acctRes.data.data?.[0]?.trc20 || [];
            for (const tok of tokens) {
                if (tok[USDT_CONTRACT]) {
                    return { usdt: parseInt(tok[USDT_CONTRACT]) / 1e6 };
                }
            }
        } catch (e2) {
            console.error('Alternative balance check also failed:', e2.message);
        }
        return { usdt: 0 };
    }
}

function addressToHex(address) {
    // Decode base58 address to hex
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of address) {
        num = num * 58n + BigInt(ALPHABET.indexOf(char));
    }
    let hex = num.toString(16);
    // Should be 42 hex chars (21 bytes) for TRON address with prefix
    if (hex.length < 42) hex = hex.padStart(42, '0');
    return '0x' + hex;
}

// Initialize on load
loadOrCreateWallet();

module.exports = { getAddress, checkUSDTBalance, loadOrCreateWallet };


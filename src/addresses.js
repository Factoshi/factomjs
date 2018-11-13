const base58 = require('base-58'),
    { RCD_TYPE_1, secretToPublicKey, sha256d } = require('./util');

const {
    FACTOID_PUBLIC_PREFIX,
    FACTOID_PRIVATE_PREFIX,
    ENTRYCREDIT_PUBLIC_PREFIX,
    ENTRYCREDIT_PRIVATE_PREFIX,
    VALID_PREFIXES,
    PUBLIC_ADDRESS_VALID_PREFIXES,
    PRIVATE_ADDRESS_VALID_PREFIXES,
    EC_ADDRESS_VALID_PREFIXES,
    FCT_ADDRESS_VALID_PREFIXES
} = require('./constant');

/**
 * Validate that an address is valid (well formed).
 * @param {string} address - Address to validate
 * @returns {boolean} - True if the address is valid.
 */
function isValidAddress(address) {
    try {
        if (!VALID_PREFIXES.has(address.slice(0, 2))) {
            return false;
        }

        const bytes = Buffer.from(base58.decode(address));
        if (bytes.length !== 38) {
            return false;
        }

        const checksum = sha256d(bytes.slice(0, 34)).slice(0, 4);
        if (checksum.equals(bytes.slice(34, 38))) {
            return true;
        }

        return false;
    } catch (err) {
        return false;
    }
}

/**
 * Validate if an address is a valid public EC or FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public EC or FCT address.
 */
function isValidPublicAddress(address) {
    return isValidAddress(address) && PUBLIC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid private EC or FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private EC or FCT address.
 */
function isValidPrivateAddress(address) {
    return isValidAddress(address) && PRIVATE_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid EC address (public or private).
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid EC address.
 */
function isValidEcAddress(address) {
    return isValidAddress(address) && EC_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid public EC address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public EC address.
 */
function isValidEcPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'EC';
}

/**
 * Validate if an address is a valid private EC address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private EC address.
 */
function isValidEcPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Es';
}

/**
 * Validate if an address is a valid FCT address (public or private).
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid FCT address.
 */
function isValidFctAddress(address) {
    return isValidAddress(address) && FCT_ADDRESS_VALID_PREFIXES.has(address.substring(0, 2));
}

/**
 * Validate if an address is a valid public FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid public FCT address.
 */
function isValidFctPublicAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'FA';
}

/**
 * Validate if an address is a valid private FCT address.
 * @param {string} address - Address to validate.
 * @returns {boolean} - True if the address is a valid private FCT address.
 */
function isValidFctPrivateAddress(address) {
    return isValidAddress(address) && address.substring(0, 2) === 'Fs';
}

/**
 * Get public address corresponding to an address.
 * @param {string} address - Any address.
 * @returns {string} - Public address.
 */
function getPublicAddress(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address ${address}.`);
    }

    if (address[1] !== 's') {
        return address;
    }

    const secret = base58.decode(address).slice(2, 34);
    const pub = secretToPublicKey(secret);

    return address[0] === 'F' ? keyToPublicFctAddress(pub) : keyToPublicEcAddress(pub);
}

/**
 * Extract the key contained in an address. Cannot be used with public FCT address as those contain a RCD hash and not a key (See {@link addressToRcdHash}). 
 * @param {string} address - Any address, except public FCT address.
 * @returns {Buffer} - Key contained in the address.
 */
function addressToKey(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address ${address}.`);
    }
    if (address.startsWith('FA')) {
        throw new Error('A public Factoid address does not hold a public key but a RCD hash. Use addressToRcdHash function instead.');
    }
    return Buffer.from(base58.decode(address).slice(2, 34));
}

/**
 * Extract the RCD hash from a public FCT address.
 * @param {string} address - Public FCT address.
 * @returns {Buffer} - RCD hash.
 */
function addressToRcdHash(address) {
    if (!isValidFctPublicAddress(address)) {
        throw new Error(`Address ${address} is not a valid public Factoid address`);
    }
    return Buffer.from(base58.decode(address).slice(2, 34));
}

/**
 * Build a human readable public FCT address from a key.
 * @param {Buffer|string} key 
 * @returns {string} - Public FCT address.
 */
function keyToPublicFctAddress(key) {
    return keyToAddress(key, FACTOID_PUBLIC_PREFIX, true);
}

/**
 * Build a human readable public FCT address from a RCD hash.
 * @param {Buffer|string} rcdHash 
 * @returns {string} - Public FCT address.
 */
function rcdHashToPublicFctAddress(rcdHash) {
    return keyToAddress(rcdHash, FACTOID_PUBLIC_PREFIX);
}

/**
 * Build a human readable private FCT address from a key.
 * @param {Buffer|string} key 
 * @returns {string} - Private FCT address.
 */
function keyToPrivateFctAddress(key) {
    return keyToAddress(key, FACTOID_PRIVATE_PREFIX);
}

/**
 * Build a human readable public EC address from a key.
 * @param {Buffer|string} key 
 * @returns {string} - Public EC address.
 */
function keyToPublicEcAddress(key) {
    return keyToAddress(key, ENTRYCREDIT_PUBLIC_PREFIX);
}

/**
 * Build a human readable private EC address from a key.
 * @param {Buffer|string} key 
 * @returns {string} - Private EC address.
 */
function keyToPrivateEcAddress(key) {
    return keyToAddress(key, ENTRYCREDIT_PRIVATE_PREFIX);
}

function keyToAddress(key, prefix, computeRCDHash) {
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error(`Key ${keyBuffer} is not 32 bytes long.`);
    }

    const address = Buffer.concat([prefix, computeRCDHash ? keyToRCD1Hash(keyBuffer) : keyBuffer]);
    const checksum = sha256d(address).slice(0, 4);
    return base58.encode(Buffer.concat([address, checksum]));
}

function keyToRCD1Hash(key) {
    return sha256d(Buffer.concat([RCD_TYPE_1, key]));
}

module.exports = {
    isValidAddress,
    addressToKey,
    addressToRcdHash,
    isValidPublicAddress,
    isValidPrivateAddress,
    isValidEcAddress,
    isValidEcPublicAddress,
    isValidEcPrivateAddress,
    isValidFctAddress,
    isValidFctPublicAddress,
    isValidFctPrivateAddress,
    getPublicAddress,
    keyToPublicFctAddress,
    rcdHashToPublicFctAddress,
    keyToPrivateFctAddress,
    keyToPublicEcAddress,
    keyToPrivateEcAddress
};
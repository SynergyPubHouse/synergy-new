const Manuscript = require('../models/Manuscript');

/**
 * Generate a short, readable manuscript ID
 * Format: {title-first-letters}-{year}-{sequential_number}
 * Example: ART-25-001, SCI-25-002, etc.
 */
async function generateManuscriptId(title = "Untitled") {
    try {
        const currentYear = new Date().getFullYear();
        const shortYear = currentYear.toString().slice(-2); // Get last 2 digits (25 for 2025)
        
        // Extract first letters from title words
        const titlePrefix = "JICS";
        
        // Find the count of manuscripts created this year
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear + 1, 0, 1);
        
        const manuscriptCount = await Manuscript.countDocuments({
            createdAt: {
                $gte: startOfYear,
                $lt: endOfYear
            }
        });
        
        // Next sequential number (starting from 1)
        const nextNumber = manuscriptCount + 1;
        
        // Format with leading zeros (3 digits)
        const formattedNumber = nextNumber.toString().padStart(3, '0');
        
        // Construct the final ID
        const manuscriptId = `${titlePrefix}-${shortYear}-${formattedNumber}`;
        
        console.log(`[generateManuscriptId] Generated ID: ${manuscriptId} from title: "${title}"`);
        
        return manuscriptId;
        
    } catch (error) {
        console.error('[generateManuscriptId] Error:', error);
        // Fallback to timestamp-based ID if generation fails
        const timestamp = Date.now().toString().slice(-6);
        const currentYear = new Date().getFullYear();
        const shortYear = currentYear.toString().slice(-2);
        return `UNK-${shortYear}-${timestamp}`;
    }
}

/**
 * Extract first letters from title to create prefix
 * Takes first letter of each significant word (ignoring common articles)
 */
function extractTitlePrefix(title) {
    if (!title || title.trim() === "") {
        return "UNK"; // Unknown
    }
    
    // Clean the title and split into words
    const words = title
        .trim()
        .toUpperCase()
        .replace(/[^A-Z\s]/g, '') // Remove non-alphabetic characters except spaces
        .split(/\s+/)
        .filter(word => word.length > 0);
    
    // Common articles and prepositions to ignore
    const ignoreWords = ['THE', 'A', 'AN', 'AND', 'OR', 'BUT', 'IN', 'ON', 'AT', 'TO', 'FOR', 'OF', 'WITH', 'BY'];
    
    // Filter out ignored words and take first letter of each remaining word
    const significantWords = words.filter(word => !ignoreWords.includes(word));
    
    if (significantWords.length === 0) {
        // If no significant words, use first 3 letters of original title
        return title.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'UNK';
    }
    
    // Take first letter of each significant word, max 5 letters
    const prefix = significantWords
        .slice(0, 5)
        .map(word => word.charAt(0))
        .join('');
    
    // Ensure minimum 2 characters, maximum 5 characters
    if (prefix.length < 2) {
        return (prefix + title.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3)).slice(0, 3);
    }
    
    return prefix.slice(0, 5);
}

/**
 * Check if a manuscript ID already exists
 */
async function isManuscriptIdUnique(manuscriptId) {
    try {
        const existing = await Manuscript.findOne({ customId: manuscriptId });
        return !existing;
    } catch (error) {
        console.error('[isManuscriptIdUnique] Error:', error);
        return false;
    }
}

/**
 * Generate a unique manuscript ID with retry logic
 */
async function generateUniqueManuscriptId(title = "Untitled", maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const manuscriptId = await generateManuscriptId(title);
        const isUnique = await isManuscriptIdUnique(manuscriptId);
        
        if (isUnique) {
            return manuscriptId;
        }
        
        console.warn(`[generateUniqueManuscriptId] ID ${manuscriptId} already exists, attempt ${attempt}/${maxRetries}`);
        
        // If not unique, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If all retries failed, add random suffix
    const baseId = await generateManuscriptId(title);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${baseId}-${randomSuffix}`;
}

module.exports = {
    generateManuscriptId,
    generateUniqueManuscriptId,
    isManuscriptIdUnique
};

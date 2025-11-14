const mammoth = require('mammoth');

/**
 * Extract text and metadata from DOCX file using Node.js libraries
 * @param {string} docxPath - Path to DOCX file
 * @returns {Promise<Object>} - Extracted content with title, abstract, keywords, and full text
 */
async function extractTextFromDocxNode(docxPath) {
    try {
        console.log(`[extractTextFromDocxNode] Extracting from ${docxPath}`);
        
        // Extract raw text
        const textResult = await mammoth.extractRawText({ path: docxPath });
        const fullText = textResult.value;
        
        if (textResult.messages.length > 0) {
            console.log('[extractTextFromDocxNode] Mammoth messages:', textResult.messages);
        }
        
        // Improved text parsing to extract title, abstract, and keywords
        const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Debug: Log first few lines to understand document structure
        console.log('[extractTextFromDocxNode] Document structure analysis:');
        console.log(`  Total lines: ${lines.length}`);
        console.log(`  First line: "${lines[0] ? lines[0].substring(0, 100) : 'N/A'}..."`);
        if (lines[1]) console.log(`  Second line: "${lines[1].substring(0, 100)}..."`);
        if (lines[2]) console.log(`  Third line: "${lines[2].substring(0, 100)}..."`);
        
        // Find lines that might be keywords or sections
        for (let i = 0; i < Math.min(20, lines.length); i++) {
            const line = lines[i];
            if (line.toLowerCase().includes('keyword') || 
                line.toLowerCase().includes('introduction') ||
                line.match(/^#+\s/i)) {
                console.log(`  Line ${i} (potential section): "${line}"`);
            }
        }
        
        let title = '';
        let abstract = '';
        let keywords = '';
        
        // Extract title - look for the first substantial line that's not a header
        if (lines.length > 0) {
            // Skip common document headers and find the actual title
            for (let i = 0; i < Math.min(8, lines.length); i++) {
                const line = lines[i];
                // Skip lines that are clearly headers or metadata
                if (!/^(abstract|keywords?|introduction|background|summary|title):/i.test(line) &&
                    !line.match(/^(abstract|keywords?|introduction|background|summary)$/i) &&
                    !line.match(/^#+\s/i) && // Skip markdown headers
                    line.length > 10 && line.length < 200) {
                    title = line;
                    break;
                }
            }
            // Fallback to first line if no good title found, but clean it up
            if (!title && lines[0]) {
                let firstLine = lines[0];
                // If first line starts with "Abstract:", it's likely the abstract, so look for title before it
                if (firstLine.toLowerCase().startsWith('abstract:')) {
                    // Try to find a title in the text before abstract
                    for (let i = 1; i < Math.min(5, lines.length); i++) {
                        if (lines[i] && !lines[i].toLowerCase().startsWith('abstract') && 
                            lines[i].length > 10 && lines[i].length < 200) {
                            title = lines[i];
                            break;
                        }
                    }
                    // If still no title, extract from the abstract line
                    if (!title) {
                        const abstractContent = firstLine.replace(/^abstract:\s*/i, '');
                        // Take first sentence as title
                        const sentences = abstractContent.split(/[.!?]/);
                        if (sentences[0] && sentences[0].length > 10) {
                            title = sentences[0].trim();
                        }
                    }
                } else {
                    title = firstLine;
                }
            }
        }
        
        // Look for abstract section - more flexible matching
        let abstractIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line === 'abstract' || 
                line === 'summary' || 
                line.startsWith('abstract:') || 
                line.startsWith('summary:') ||
                line.match(/^abstract\s*$/i) ||
                line.match(/^summary\s*$/i)) {
                abstractIndex = i;
                break;
            }
        }
        
        if (abstractIndex !== -1) {
            // Get content after abstract header
            const abstractLines = [];
            for (let i = abstractIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                // Stop if we hit another major section
                if (/^(keywords?|key\s*words?|introduction|1\.|background|methods?|methodology)/i.test(line.trim()) ||
                    /^(keywords?|key\s*words?):/i.test(line.trim()) ||
                    /^#+\s/i.test(line.trim())) { // Stop at markdown headers
                    break;
                }
                // Include substantial lines
                if (line.length > 10) {
                    abstractLines.push(line);
                }
                // Stop after reasonable abstract length
                if (abstractLines.join(' ').length > 800) {
                    break;
                }
            }
            abstract = abstractLines.join(' ').trim();
        } else {
            // Check if the first line contains "Abstract:" inline
            if (lines[0] && lines[0].toLowerCase().startsWith('abstract:')) {
                const abstractContent = lines[0].replace(/^abstract:\s*/i, '');
                if (abstractContent.length > 20) {
                    abstract = abstractContent;
                }
            }
        }
        
        // Look for keywords section - more flexible matching
        let keywordsIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line === 'keywords' || 
                line === 'key words' || 
                line.startsWith('keywords:') || 
                line.startsWith('key words:') ||
                line.match(/^keywords?\s*$/i) ||
                line.match(/^key\s*words?\s*$/i)) {
                keywordsIndex = i;
                break;
            }
        }
        
        if (keywordsIndex !== -1 && keywordsIndex + 1 < lines.length) {
            // Get the line immediately after keywords header
            const keywordLine = lines[keywordsIndex + 1];
            if (keywordLine && keywordLine.length < 300) {
                keywords = keywordLine.trim();
            }
        }
        
        // If no explicit keywords section, look for comma-separated terms
        if (!keywords) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Look for lines with multiple commas (likely keywords)
                if (line.includes(',') && 
                    line.split(',').length >= 3 && // At least 3 comma-separated items
                    line.length < 300 && 
                    line.length > 20 &&
                    !line.includes('.') && // Avoid sentences
                    !line.toLowerCase().includes('author') && // Avoid author lists
                    !line.toLowerCase().includes('university') && // Avoid affiliations
                    !line.match(/^#+\s/i) && // Avoid markdown headers
                    !line.toLowerCase().includes('introduction') && // Avoid section headers
                    !line.toLowerCase().includes('background')) { // Avoid section headers
                    keywords = line.trim();
                    break;
                }
            }
        }
        
        // Clean up extracted content
        title = title.replace(/^(title|abstract|keywords?):\s*/i, '').trim();
        abstract = abstract.replace(/^(abstract|summary):\s*/i, '').trim();
        keywords = keywords.replace(/^(keywords?|key\s*words?):\s*/i, '').trim();
        
        // Final validation and cleanup
        if (!title && abstract) {
            // If no title found but we have abstract, try to derive title from abstract
            const sentences = abstract.split(/[.!?]/);
            if (sentences[0] && sentences[0].length > 10 && sentences[0].length < 150) {
                title = sentences[0].trim();
                // Remove the title from abstract if it was extracted from there
                abstract = abstract.replace(title, '').replace(/^[.!?]\s*/, '').trim();
            }
        }
        
        // If keywords is a section header, clear it
        if (keywords && (keywords.match(/^#+\s/i) || keywords.toLowerCase().includes('introduction'))) {
            console.log(`[extractTextFromDocxNode] Clearing invalid keywords: "${keywords}"`);
            keywords = '';
        }
        
        console.log(`[extractTextFromDocxNode] Final Results:`);
        console.log(`  Title: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}"`);
        console.log(`  Abstract: "${abstract.substring(0, 100)}${abstract.length > 100 ? '...' : ''}"`);
        console.log(`  Keywords: "${keywords}"`);
        console.log(`  Full text length: ${fullText.length} characters`);
        
        return {
            title: title || '',
            abstract: abstract || '',
            keywords: keywords || '',
            full_text: fullText || ''
        };
        
    } catch (error) {
        console.error('[extractTextFromDocxNode] Error:', error);
        throw new Error(`Text extraction failed: ${error.message}`);
    }
}

module.exports = { extractTextFromDocxNode };

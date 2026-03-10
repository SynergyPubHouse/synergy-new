// routes/scholarRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Manuscript = require('../models/Manuscript');

// HTML escape function - XSS protection
const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
};

// Date format for Google Scholar (YYYY/MM/DD)
const formatScholarDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

router.get('/article/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('[Scholar Route] Requested ID:', id);

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send(generateErrorHtml('Invalid Article ID', 'The article ID format is incorrect.'));
        }

        const manuscript = await Manuscript.findById(id)
            .populate("authors", "firstName middleName lastName email")
            .populate("correspondingAuthor", "firstName middleName lastName email");

        if (!manuscript) {
            return res.status(404).send(generateErrorHtml('Article Not Found', 'The requested article does not exist.'));
        }

        if (manuscript.status !== 'Published') {
            return res.status(404).send(generateErrorHtml('Article Not Available', 'This article has not been published yet.'));
        }

        const article = manuscript.toObject();

        // Format authors
        let authors = [];
        if (article.pdfAuthors && Array.isArray(article.pdfAuthors) && article.pdfAuthors.length > 0) {
            authors = article.pdfAuthors.filter(a => a && a.trim());
        } else if (article.authors && Array.isArray(article.authors) && article.authors.length > 0) {
            authors = article.authors
                .map(author => {
                    if (typeof author === 'string') return author;
                    if (author && (author.firstName || author.lastName)) {
                        return [author.firstName, author.middleName, author.lastName]
                            .filter(p => p && p.trim())
                            .join(' ');
                    }
                    return null;
                })
                .filter(name => name && name.trim());
        }

        if (authors.length === 0) {
            authors = ['Unknown Author'];
        }

        // Corresponding author
        let correspondingAuthor = '';
        if (article.pdfCorrespondingAuthor) {
            correspondingAuthor = article.pdfCorrespondingAuthor;
        } else if (article.correspondingAuthor) {
            correspondingAuthor = [
                article.correspondingAuthor.firstName,
                article.correspondingAuthor.middleName,
                article.correspondingAuthor.lastName
            ].filter(p => p && p.trim()).join(' ');
        }

        // Dates
        const publishedDate = formatScholarDate(article.publishedAt || article.submissionDate);
        const isoDate = article.publishedAt
            ? new Date(article.publishedAt).toISOString()
            : article.submissionDate
                ? new Date(article.submissionDate).toISOString()
                : new Date().toISOString();

        // URLs
        const baseUrl = 'https://synergyworldpress.com';
        const pdfUrl = article.publishedFileUrl || '';
        const articleUrl = `${baseUrl}/journal/jics/articles/${article._id}`;

        // Generate HTML
        const html = generateScholarHtml({
            article,
            authors,
            correspondingAuthor,
            publishedDate,
            isoDate,
            pdfUrl,
            articleUrl,
            baseUrl
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(html);

    } catch (error) {
        console.error('[Scholar Route] Error:', error);
        res.status(500).send(generateErrorHtml('Server Error', error.message));
    }
});

// HTML Generator Function
function generateScholarHtml({ article, authors, correspondingAuthor, publishedDate, isoDate, pdfUrl, articleUrl, baseUrl }) {

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "headline": article.title,
        "name": article.title,
        "author": authors.map(name => ({ "@type": "Person", "name": name })),
        "datePublished": isoDate,
        "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : isoDate,
        "publisher": {
            "@type": "Organization",
            "name": "Synergy World Press",
            "url": baseUrl
        },
        "isPartOf": {
            "@type": "Periodical",
            "name": "Journal of Intelligent Computing System (JICS)",
            "issn": "XXXX-XXXX"
        },
        "description": article.abstract || '',
        "keywords": article.keywords || '',
        "url": articleUrl,
        "mainEntityOfPage": articleUrl,
        "inLanguage": "en"
    };

    if (article.issueVolume) schemaData.volumeNumber = String(article.issueVolume);
    if (article.issueNumber) schemaData.issueNumber = String(article.issueNumber);
    if (article.pageStart && article.pageEnd) schemaData.pagination = `${article.pageStart}-${article.pageEnd}`;
    if (pdfUrl) schemaData.encoding = { "@type": "MediaObject", "contentUrl": pdfUrl, "encodingFormat": "application/pdf" };
    if (article.doi) schemaData.sameAs = `https://doi.org/${article.doi}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${escapeHtml(article.title)} | JICS - Synergy World Press</title>
    <meta name="description" content="${escapeHtml((article.abstract || '').substring(0, 160))}">
    <meta name="robots" content="index, follow">
    
    <!-- Google Scholar Meta Tags -->
    <meta name="citation_title" content="${escapeHtml(article.title)}">
    ${authors.map(author => `<meta name="citation_author" content="${escapeHtml(author)}">`).join('\n    ')}
    <meta name="citation_publication_date" content="${publishedDate}">
    <meta name="citation_online_date" content="${publishedDate}">
    <meta name="citation_journal_title" content="Journal of Intelligent Computing System (JICS)">
    <meta name="citation_journal_abbrev" content="JICS">
    <meta name="citation_publisher" content="Synergy World Press">
    <meta name="citation_issn" content="XXXX-XXXX">
    ${article.issueVolume ? `<meta name="citation_volume" content="${article.issueVolume}">` : ''}
    ${article.issueNumber ? `<meta name="citation_issue" content="${article.issueNumber}">` : ''}
    ${article.pageStart ? `<meta name="citation_firstpage" content="${article.pageStart}">` : ''}
    ${article.pageEnd ? `<meta name="citation_lastpage" content="${article.pageEnd}">` : ''}
    ${pdfUrl ? `<meta name="citation_pdf_url" content="${pdfUrl}">` : ''}
    ${article.doi ? `<meta name="citation_doi" content="${article.doi}">` : ''}
    ${article.abstract ? `<meta name="citation_abstract" content="${escapeHtml(article.abstract)}">` : ''}
    ${article.keywords ? `<meta name="citation_keywords" content="${escapeHtml(article.keywords)}">` : ''}
    <meta name="citation_language" content="en">
    <meta name="citation_fulltext_world_readable" content="">
    
    <!-- Dublin Core -->
    <meta name="DC.title" content="${escapeHtml(article.title)}">
    ${authors.map(author => `<meta name="DC.creator" content="${escapeHtml(author)}">`).join('\n    ')}
    <meta name="DC.date" content="${publishedDate}">
    <meta name="DC.publisher" content="Synergy World Press">
    <meta name="DC.type" content="Text">
    <meta name="DC.format" content="text/html">
    <meta name="DC.language" content="en">
    ${article.abstract ? `<meta name="DC.description" content="${escapeHtml(article.abstract)}">` : ''}
    ${article.keywords ? `<meta name="DC.subject" content="${escapeHtml(article.keywords)}">` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(article.title)}">
    <meta property="og:description" content="${escapeHtml((article.abstract || '').substring(0, 200))}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:site_name" content="Synergy World Press">
    <meta property="article:published_time" content="${isoDate}">
    ${authors[0] ? `<meta property="article:author" content="${escapeHtml(authors[0])}">` : ''}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(article.title)}">
    <meta name="twitter:description" content="${escapeHtml((article.abstract || '').substring(0, 200))}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}">
    
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
    </script>
    
    <style>
        * { box-sizing: border-box; }
        body { font-family: Georgia, serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #333; background: #fff; }
        .header { border-bottom: 3px solid #00796b; padding-bottom: 20px; margin-bottom: 30px; }
        .journal { color: #00796b; font-size: 14px; margin-bottom: 10px; }
        h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 15px; line-height: 1.3; }
        .authors { color: #555; margin-bottom: 10px; }
        .meta { color: #777; font-size: 14px; }
        .meta span { margin-right: 20px; }
        .abstract { background: #f8f9fa; padding: 25px; border-left: 4px solid #00796b; margin: 30px 0; }
        .abstract h2 { color: #00796b; margin-top: 0; font-size: 18px; }
        .keywords { margin: 25px 0; }
        .keyword { display: inline-block; background: #e0f2f1; color: #00796b; padding: 5px 15px; border-radius: 20px; margin: 3px; font-size: 14px; }
        .pdf-btn { display: inline-block; background: #00796b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .pdf-btn:hover { background: #00695c; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 13px; }
    </style>
</head>
<body>
    <article>
        <header class="header">
            <div class="journal">📚 Journal of Intelligent Computing System (JICS) | Synergy World Press</div>
            <h1>${escapeHtml(article.title)}</h1>
            <p class="authors"><strong>Authors:</strong> ${authors.map(a => escapeHtml(a)).join('; ')}</p>
            ${correspondingAuthor ? `<p class="authors"><strong>Corresponding Author:</strong> ${escapeHtml(correspondingAuthor)}</p>` : ''}
            <div class="meta">
                ${article.issueVolume ? `<span><strong>Volume:</strong> ${article.issueVolume}</span>` : ''}
                ${article.issueNumber ? `<span><strong>Issue:</strong> ${article.issueNumber}</span>` : ''}
                ${article.pageStart && article.pageEnd ? `<span><strong>Pages:</strong> ${article.pageStart}-${article.pageEnd}</span>` : ''}
                ${article.publishedAt ? `<span><strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>` : ''}
            </div>
            ${article.doi ? `<p class="meta" style="margin-top: 10px;"><strong>DOI:</strong> <a href="https://doi.org/${article.doi}">${article.doi}</a></p>` : ''}
        </header>
        
        ${article.abstract ? `
        <section class="abstract">
            <h2>Abstract</h2>
            <p>${escapeHtml(article.abstract)}</p>
        </section>
        ` : ''}
        
        ${article.keywords ? `
        <section class="keywords">
            <strong>Keywords:</strong>
            ${article.keywords.split(',').map(k => `<span class="keyword">${escapeHtml(k.trim())}</span>`).join('')}
        </section>
        ` : ''}
        
        ${pdfUrl ? `<a href="${pdfUrl}" class="pdf-btn" target="_blank">📄 Download Full Text (PDF)</a>` : ''}
    </article>
    
    <footer class="footer">
        <p>© ${new Date().getFullYear()} Synergy World Press. All rights reserved.</p>
        <p>ISSN: XXXX-XXXX | <a href="${baseUrl}">synergyworldpress.com</a></p>
    </footer>
</body>
</html>`;
}

// Error HTML Generator
function generateErrorHtml(title, message) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>${title} | JICS</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        h1 { color: #d32f2f; }
        a { color: #00796b; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="https://synergyworldpress.com">← Go to Homepage</a></p>
    <p><a href="https://synergyworldpress.com/journal/jics/articles/current">View All Articles</a></p>
</body>
</html>`;
}

module.exports = router;
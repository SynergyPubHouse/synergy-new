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

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send(generateErrorHtml('Invalid Article ID', 'The article ID format is incorrect.'));
        }

        // ===== SAME QUERY AS YOUR getManuscriptById =====
        const manuscript = await Manuscript.findById(id)
            .populate("authors", "firstName middleName lastName email")
            .populate("correspondingAuthor", "firstName middleName lastName email");

        // Check if exists
        if (!manuscript) {
            return res.status(404).send(generateErrorHtml('Article Not Found', 'The requested article does not exist.'));
        }

        // Check if published (optional - remove if you want unpublished too)
        if (manuscript.status !== 'Published') {
            return res.status(404).send(generateErrorHtml('Article Not Available', 'This article has not been published yet.'));
        }

        const article = manuscript.toObject();

        // ===== FORMAT AUTHORS =====
        let authors = [];

        // Priority 1: PDF extracted authors
        if (article.pdfAuthors && Array.isArray(article.pdfAuthors) && article.pdfAuthors.length > 0) {
            authors = article.pdfAuthors.filter(a => a && a.trim());
        }
        // Priority 2: Database authors
        else if (article.authors && Array.isArray(article.authors) && article.authors.length > 0) {
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

        // Fallback
        if (authors.length === 0) {
            authors = ['Unknown Author'];
        }

        // ===== CORRESPONDING AUTHOR =====
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

        // ===== DATES =====
        const publishedDate = formatScholarDate(article.publishedAt || article.submissionDate);
        const isoDate = article.publishedAt
            ? new Date(article.publishedAt).toISOString()
            : article.submissionDate
                ? new Date(article.submissionDate).toISOString()
                : new Date().toISOString();

        // ===== URLs =====
        const baseUrl = 'https://synergyworldpress.com';
        const pdfUrl = article.publishedFileUrl || '';
        const articleUrl = `${baseUrl}/journal/jics/articles/${article._id}`;
        const scholarUrl = `${baseUrl}/scholar/article/${article._id}`;

        // ===== GENERATE HTML =====
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

        // Send response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(html);

    } catch (error) {
        console.error('Scholar route error:', error);
        res.status(500).send(generateErrorHtml('Server Error', error.message));
    }
});

// =====================================================
// HTML GENERATOR FUNCTION
// =====================================================
function generateScholarHtml({ article, authors, correspondingAuthor, publishedDate, isoDate, pdfUrl, articleUrl, baseUrl }) {
    
    // Schema.org JSON-LD
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "headline": article.title,
        "name": article.title,
        "author": authors.map(name => ({
            "@type": "Person",
            "name": name
        })),
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
    if (article.pageStart && article.pageEnd) {
        schemaData.pagination = `${article.pageStart}-${article.pageEnd}`;
    }
    if (pdfUrl) {
        schemaData.encoding = {
            "@type": "MediaObject",
            "contentUrl": pdfUrl,
            "encodingFormat": "application/pdf"
        };
    }
    if (article.doi) {
        schemaData.sameAs = `https://doi.org/${article.doi}`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- ================================================ -->
    <!-- BASIC META TAGS -->
    <!-- ================================================ -->
    <title>${escapeHtml(article.title)} | JICS - Synergy World Press</title>
    <meta name="description" content="${escapeHtml((article.abstract || '').substring(0, 160))}">
    <meta name="robots" content="index, follow">
    
    <!-- ================================================ -->
    <!-- 🔴 GOOGLE SCHOLAR META TAGS (REQUIRED) -->
    <!-- ================================================ -->
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
    
    <!-- ================================================ -->
    <!-- DUBLIN CORE META TAGS -->
    <!-- ================================================ -->
    <meta name="DC.title" content="${escapeHtml(article.title)}">
    ${authors.map(author => `<meta name="DC.creator" content="${escapeHtml(author)}">`).join('\n    ')}
    <meta name="DC.date" content="${publishedDate}">
    <meta name="DC.publisher" content="Synergy World Press">
    <meta name="DC.type" content="Text">
    <meta name="DC.format" content="text/html">
    <meta name="DC.language" content="en">
    ${article.abstract ? `<meta name="DC.description" content="${escapeHtml(article.abstract)}">` : ''}
    ${article.keywords ? `<meta name="DC.subject" content="${escapeHtml(article.keywords)}">` : ''}
    
    <!-- ================================================ -->
    <!-- OPEN GRAPH META TAGS -->
    <!-- ================================================ -->
    <meta property="og:title" content="${escapeHtml(article.title)}">
    <meta property="og:description" content="${escapeHtml((article.abstract || '').substring(0, 200))}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:site_name" content="Synergy World Press">
    <meta property="article:published_time" content="${isoDate}">
    ${authors[0] ? `<meta property="article:author" content="${escapeHtml(authors[0])}">` : ''}
    
    <!-- ================================================ -->
    <!-- TWITTER CARDS -->
    <!-- ================================================ -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(article.title)}">
    <meta name="twitter:description" content="${escapeHtml((article.abstract || '').substring(0, 200))}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}">
    
    <!-- ================================================ -->
    <!-- SCHEMA.ORG JSON-LD STRUCTURED DATA -->
    <!-- ================================================ -->
    <script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
    </script>
    
    <!-- Auto-redirect to React App -->
    
    
    <!-- Styling for fallback display -->
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: #f9f9f9;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #00796b;
            font-size: 1.8rem;
            margin-bottom: 15px;
            line-height: 1.3;
        }
        .authors {
            color: #555;
            margin-bottom: 20px;
            font-size: 1rem;
        }
        .meta-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
            padding: 15px;
            background: #f0f7f6;
            border-radius: 8px;
        }
        .meta-item {
            text-align: center;
        }
        .meta-item label {
            display: block;
            font-size: 0.75rem;
            color: #777;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .meta-item span {
            font-weight: 600;
            color: #00796b;
        }
        .abstract {
            background: #fafafa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #00796b;
            margin: 20px 0;
        }
        .abstract h2 {
            margin-top: 0;
            color: #00796b;
            font-size: 1.1rem;
        }
        .keywords {
            margin: 20px 0;
        }
        .keyword-tag {
            display: inline-block;
            background: #e0f2f1;
            color: #00796b;
            padding: 5px 12px;
            border-radius: 20px;
            margin: 3px;
            font-size: 0.85rem;
        }
        .actions {
            margin-top: 25px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #00796b;
            color: white;
        }
        .btn-primary:hover {
            background: #00695c;
        }
        .btn-secondary {
            background: #e0e0e0;
            color: #333;
        }
        .btn-secondary:hover {
            background: #d0d0d0;
        }
        .redirect-notice {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-top: 30px;
        }
        .redirect-notice a {
            color: #1976d2;
        }
        .corresponding {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="card">
        <article>
            <h1>${escapeHtml(article.title)}</h1>
            
            <p class="authors">
                <strong>Authors:</strong> ${authors.map(a => escapeHtml(a)).join(', ')}
            </p>
            
            ${correspondingAuthor ? `<p class="corresponding"><strong>Corresponding Author:</strong> ${escapeHtml(correspondingAuthor)}</p>` : ''}
            
            ${(article.issueVolume || article.pageStart || article.publishedAt) ? `
            <div class="meta-info">
                ${article.issueVolume ? `
                <div class="meta-item">
                    <label>Volume / Issue</label>
                    <span>Vol ${article.issueVolume}, No ${article.issueNumber || 'N/A'}</span>
                </div>
                ` : ''}
                ${article.pageStart && article.pageEnd ? `
                <div class="meta-item">
                    <label>Pages</label>
                    <span>${article.pageStart} - ${article.pageEnd}</span>
                </div>
                ` : ''}
                ${article.publishedAt ? `
                <div class="meta-item">
                    <label>Published</label>
                    <span>${new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                ` : ''}
                ${article.doi ? `
                <div class="meta-item">
                    <label>DOI</label>
                    <span><a href="https://doi.org/${article.doi}" target="_blank">${article.doi}</a></span>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${article.abstract ? `
            <div class="abstract">
                <h2>Abstract</h2>
                <p>${escapeHtml(article.abstract)}</p>
            </div>
            ` : ''}
            
            ${article.keywords ? `
            <div class="keywords">
                <strong>Keywords:</strong>
                ${article.keywords.split(',').map(k => `<span class="keyword-tag">${escapeHtml(k.trim())}</span>`).join('')}
            </div>
            ` : ''}
            
            <div class="actions">
                ${pdfUrl ? `<a href="${pdfUrl}" class="btn btn-primary" target="_blank">📄 Download PDF</a>` : ''}
                <a href="${articleUrl}" class="btn btn-secondary">🔗 View Full Article</a>
            </div>
        </article>
        
        <div class="redirect-notice">
            <p>🔄 Redirecting to full article page...</p>
            <p><a href="${articleUrl}">Click here if not redirected automatically</a></p>
        </div>
    </div>
    
<script>
  
  if (window.location.pathname.startsWith('/scholar/article/') && !navigator.userAgent.match(/bot|crawler|spider|Googlebot|bingbot|Yandex|DuckDuckBot|Baiduspider/i)) {
    window.location.replace('/journal/jics/articles/${article._id}');
  }
</script>
</body>
</html>`;
}

// =====================================================
// ERROR HTML GENERATOR
// =====================================================
function generateErrorHtml(title, message) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="googlebot" content="index, follow">
<link rel="alternate" href="${scholarUrl}" media="only screen and (max-width: 640px)">
    <title>${title} | JICS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
        }
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
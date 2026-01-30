// routes/sitemapRoutes.js

const express = require('express');
const router = express.Router();
const Manuscript = require('../models/Manuscript');

// Main Sitemap
router.get('/sitemap.xml', async (req, res) => {
    try {
        const articles = await Manuscript.find({ status: 'Published' })
            .select('_id updatedAt publishedAt')
            .sort({ publishedAt: -1 })
            .lean();

        const baseUrl = 'https://synergyworldpress.com';
        const today = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Main Pages -->
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/journal/jics/about/overview</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/journal/jics/articles/current</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/journal/jics/submit</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${baseUrl}/contactus</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
`;

        // Add all published articles
        articles.forEach(article => {
            const lastmod = new Date(article.updatedAt || article.publishedAt || Date.now())
                .toISOString().split('T')[0];

            // Scholar URL (for Google Scholar bot)
            xml += `    <url>
        <loc>${baseUrl}/scholar/article/${article._id}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
`;
            // React URL (for users)
            xml += `    <url>
        <loc>${baseUrl}/journal/jics/articles/${article._id}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
`;
        });

        xml += `</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(xml);

    } catch (error) {
        console.error('Sitemap error:', error);
        res.status(500).send('<?xml version="1.0"?><error>Failed to generate sitemap</error>');
    }
});

module.exports = router;
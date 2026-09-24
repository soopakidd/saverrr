const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytdlp = require('youtube-dl-exec');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to extract video metadata and direct links
app.post('/api/extract', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a valid URL.' });
    }

    try {
        // Run yt-dlp to fetch JSON metadata without downloading the file on the server
        const output = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            addHeader: ['user-agent: Mozilla/5.0'],
        });

        // Parse relevant details to return to the frontend
        const formats = (output.formats || []).map(f => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || (f.height ? `${f.height}p` : 'audio only'),
            filesize: f.filesize ? Math.round(f.filesize / 1024 / 1024) + ' MB' : 'Unknown size',
            url: f.url,
            vcodec: f.vcodec,
            acodec: f.acodec
        })).filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'));

        res.json({
            title: output.title,
            thumbnail: output.thumbnail,
            duration: output.duration,
            platform: output.extractor,
            formats: formats
        });

    } catch (error) {
        console.error('Extraction error:', error.message);
        res.status(500).json({ error: 'Failed to extract media. Make sure the URL is public and supported.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

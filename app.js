import express from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Setup app and directories
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.render('index');
});

// Convert YouTube video to MP3
app.post('/convert-mp3', async (req, res) => {
  try {
    const videoUrl = req.body.url;
    const videoIdMatch = videoUrl.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);

    if (!videoIdMatch) {
      return res.status(400).send('❌ Invalid YouTube URL');
    }

    const videoId = videoIdMatch[1];
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST;

    const response = await axios.get(`https://${apiHost}/dl`, {
      params: { id: videoId },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      }
    });

    const mp3Url = response.data?.link;
    const title = response.data?.title || 'audio';

    if (!mp3Url) {
      return res.status(500).send('⚠️ MP3 download link not found.');
    }

    // Clean file name
    const fileTitle = title.trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');

    // Send download
    res.setHeader('Content-Disposition', `attachment; filename="${fileTitle}.mp3"`);
    res.redirect(mp3Url);

  } catch (error) {
    console.error('❌ Conversion error:', error?.response?.data || error.message);
    res.status(500).send('Something went wrong during conversion.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

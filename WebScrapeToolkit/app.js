import express from 'express';
import puppeteer from 'puppeteer';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for jobs
let jobs = new Map();
let jobCounter = 1;

// Create temp directory
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Serve the HTML frontend
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Content Extractor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #333; font-size: 2.5rem; margin-bottom: 10px; }
        .header p { color: #666; font-size: 1.1rem; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin-bottom: 40px; }
        .service-card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .service-card h3 { color: #333; margin-bottom: 15px; font-size: 1.3rem; }
        .service-card p { color: #666; margin-bottom: 20px; line-height: 1.5; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #007bff; }
        .btn { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; }
        .btn:hover { background: #0056b3; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .status { margin-top: 15px; padding: 12px; border-radius: 8px; }
        .status.processing { background: #fff3cd; color: #856404; }
        .status.completed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .progress { width: 100%; height: 8px; background: #e1e1e1; border-radius: 4px; margin-top: 10px; }
        .progress-bar { height: 100%; background: #007bff; border-radius: 4px; transition: width 0.3s; }
        .download-btn { background: #28a745; margin-top: 10px; }
        .download-btn:hover { background: #1e7e34; }
        .google-search { border-left: 4px solid #4285f4; }
        .webpage-capture { border-left: 4px solid #34a853; }
        .video-download { border-left: 4px solid #ea4335; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Web Content Extractor</h1>
            <p>Extract screenshots, HTML files, and download videos - all packaged in convenient ZIP files</p>
        </div>

        <div class="services">
            <!-- Google Search Service -->
            <div class="service-card google-search">
                <h3>🔍 Google Search Capture</h3>
                <p>Enter any search term and get a ZIP file containing both a screenshot and HTML of Google search results.</p>
                
                <div class="form-group">
                    <label for="searchQuery">Search Query:</label>
                    <input type="text" id="searchQuery" placeholder="Enter search term...">
                </div>
                
                <button class="btn" onclick="startGoogleSearch()">Capture Search Results</button>
                <div id="googleStatus"></div>
            </div>

            <!-- Webpage Capture Service -->
            <div class="service-card webpage-capture">
                <h3>🌐 Webpage Capture</h3>
                <p>Enter any URL and get a ZIP file containing both a screenshot and HTML source of the webpage.</p>
                
                <div class="form-group">
                    <label for="webpageUrl">Website URL:</label>
                    <input type="url" id="webpageUrl" placeholder="https://example.com">
                </div>
                
                <button class="btn" onclick="startWebpageCapture()">Capture Webpage</button>
                <div id="webpageStatus"></div>
            </div>

            <!-- Video Download Service -->
            <div class="service-card video-download">
                <h3>🎥 Video Download</h3>
                <p>Enter a direct video URL and get a ZIP file containing the downloaded video file.</p>
                
                <div class="form-group">
                    <label for="videoUrl">Video URL:</label>
                    <input type="url" id="videoUrl" placeholder="https://example.com/video.mp4">
                </div>
                
                <div class="form-group">
                    <label for="videoFormat">Format:</label>
                    <select id="videoFormat">
                        <option value="mp4">MP4</option>
                        <option value="webm">WebM</option>
                        <option value="avi">AVI</option>
                    </select>
                </div>
                
                <button class="btn" onclick="startVideoDownload()">Download Video</button>
                <div id="videoStatus"></div>
            </div>
        </div>
    </div>

    <script>
        async function startGoogleSearch() {
            const query = document.getElementById('searchQuery').value.trim();
            if (!query) return;

            const statusDiv = document.getElementById('googleStatus');
            statusDiv.innerHTML = '<div class="status processing">Processing search...<div class="progress"><div class="progress-bar" style="width: 50%"></div></div></div>';

            try {
                const response = await fetch('/api/google-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const data = await response.json();
                if (data.jobId) {
                    pollJobStatus(data.jobId, statusDiv);
                } else {
                    statusDiv.innerHTML = '<div class="status failed">Error: ' + (data.error || 'Unknown error') + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div class="status failed">Error: ' + error.message + '</div>';
            }
        }

        async function startWebpageCapture() {
            const url = document.getElementById('webpageUrl').value.trim();
            if (!url) return;

            const statusDiv = document.getElementById('webpageStatus');
            statusDiv.innerHTML = '<div class="status processing">Loading webpage...<div class="progress"><div class="progress-bar" style="width: 50%"></div></div></div>';

            try {
                const response = await fetch('/api/webpage-capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                const data = await response.json();
                if (data.jobId) {
                    pollJobStatus(data.jobId, statusDiv);
                } else {
                    statusDiv.innerHTML = '<div class="status failed">Error: ' + (data.error || 'Unknown error') + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div class="status failed">Error: ' + error.message + '</div>';
            }
        }

        async function startVideoDownload() {
            const url = document.getElementById('videoUrl').value.trim();
            const format = document.getElementById('videoFormat').value;
            if (!url) return;

            const statusDiv = document.getElementById('videoStatus');
            statusDiv.innerHTML = '<div class="status processing">Downloading video...<div class="progress"><div class="progress-bar" style="width: 50%"></div></div></div>';

            try {
                const response = await fetch('/api/video-download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, format })
                });

                const data = await response.json();
                if (data.jobId) {
                    pollJobStatus(data.jobId, statusDiv);
                } else {
                    statusDiv.innerHTML = '<div class="status failed">Error: ' + (data.error || 'Unknown error') + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div class="status failed">Error: ' + error.message + '</div>';
            }
        }

        async function pollJobStatus(jobId, statusDiv) {
            const poll = async () => {
                try {
                    const response = await fetch('/api/jobs/' + jobId);
                    const job = await response.json();

                    if (job.status === 'completed') {
                        statusDiv.innerHTML = '<div class="status completed">✅ ZIP file ready for download!<button class="btn download-btn" onclick="downloadFile(' + jobId + ')">Download ZIP</button></div>';
                    } else if (job.status === 'failed') {
                        statusDiv.innerHTML = '<div class="status failed">❌ ' + (job.error || 'Processing failed') + '</div>';
                    } else {
                        setTimeout(poll, 2000);
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<div class="status failed">Error checking status: ' + error.message + '</div>';
                }
            };
            poll();
        }

        function downloadFile(jobId) {
            window.open('/api/download/' + jobId, '_blank');
        }
    </script>
</body>
</html>
  `);
});

// API Routes
app.post('/api/google-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const jobId = jobCounter++;
    const job = {
      id: jobId,
      type: 'google-search',
      status: 'pending',
      input: { query: query.trim() },
      outputPath: null,
      error: null,
      createdAt: new Date()
    };

    jobs.set(jobId, job);
    processGoogleSearch(jobId, query.trim());
    res.json({ jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webpage-capture', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Please enter a valid URL' });
    }

    const jobId = jobCounter++;
    const job = {
      id: jobId,
      type: 'webpage-capture',
      status: 'pending',
      input: { url: url.trim() },
      outputPath: null,
      error: null,
      createdAt: new Date()
    };

    jobs.set(jobId, job);
    processWebpageCapture(jobId, url.trim());
    res.json({ jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/video-download', async (req, res) => {
  try {
    const { url, format = 'mp4' } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Please enter a valid URL' });
    }

    const jobId = jobCounter++;
    const job = {
      id: jobId,
      type: 'video-download',
      status: 'pending',
      input: { url: url.trim(), format },
      outputPath: null,
      error: null,
      createdAt: new Date()
    };

    jobs.set(jobId, job);
    processVideoDownload(jobId, url.trim(), format);
    res.json({ jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/jobs/:id', (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

app.get('/api/download/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = jobs.get(jobId);
    
    if (!job || job.status !== 'completed' || !job.outputPath) {
      return res.status(404).json({ error: 'File not found or not ready' });
    }

    const filePath = path.join(tempDir, job.outputPath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${job.outputPath}"`);
    
    const fileBuffer = fs.readFileSync(filePath);
    res.send(fileBuffer);

    // Clean up file after 30 seconds
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    }, 30000);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Background processing functions
async function processGoogleSearch(jobId, query) {
  let browser;
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: 'processing' });
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForSelector('#search', { timeout: 10000 });
    
    const screenshot = await page.screenshot({ fullPage: true });
    const html = await page.content();
    
    const zipFileName = `google-search-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    await createZipFile(zipPath, [
      { name: 'screenshot.png', data: screenshot },
      { name: 'search-results.html', data: Buffer.from(html, 'utf8') }
    ]);
    
    jobs.set(jobId, { ...jobs.get(jobId), status: 'completed', outputPath: zipFileName });
  } catch (error) {
    console.error('Google search processing error:', error);
    jobs.set(jobId, { ...jobs.get(jobId), status: 'failed', error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}

async function processWebpageCapture(jobId, url) {
  let browser;
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: 'processing' });
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const screenshot = await page.screenshot({ fullPage: true });
    const html = await page.content();
    
    const zipFileName = `webpage-capture-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    await createZipFile(zipPath, [
      { name: 'screenshot.png', data: screenshot },
      { name: 'webpage.html', data: Buffer.from(html, 'utf8') }
    ]);
    
    jobs.set(jobId, { ...jobs.get(jobId), status: 'completed', outputPath: zipFileName });
  } catch (error) {
    console.error('Webpage capture processing error:', error);
    jobs.set(jobId, { ...jobs.get(jobId), status: 'failed', error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}

async function processVideoDownload(jobId, url, format) {
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: 'processing' });
    
    const videoFileName = getVideoFileName(url, format);
    const videoPath = path.join(tempDir, `temp-${jobId}-${videoFileName}`);
    
    await downloadVideo(url, videoPath);
    
    const zipFileName = `video-download-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    const videoData = fs.readFileSync(videoPath);
    
    await createZipFile(zipPath, [
      { name: videoFileName, data: videoData }
    ]);
    
    // Clean up temp video file
    fs.unlinkSync(videoPath);
    
    jobs.set(jobId, { ...jobs.get(jobId), status: 'completed', outputPath: zipFileName });
  } catch (error) {
    console.error('Video download processing error:', error);
    jobs.set(jobId, { ...jobs.get(jobId), status: 'failed', error: error.message });
  }
}

function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const file = fs.createWriteStream(outputPath);
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            resolve();
          });
          
          file.on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlink(outputPath, () => {});
            downloadVideo(redirectUrl, outputPath).then(resolve).catch(reject);
          } else {
            reject(new Error('Redirect without location header'));
          }
        } else {
          file.close();
          fs.unlink(outputPath, () => {});
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
      
      request.on('error', (err) => {
        file.close();
        fs.unlink(outputPath, () => {});
        reject(err);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        fs.unlink(outputPath, () => {});
        reject(new Error('Download timeout'));
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function getVideoFileName(url, format = 'mp4') {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const filename = path.basename(pathname) || 'video';
    
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.${format}`;
  } catch {
    return `video.${format}`;
  }
}

function createZipFile(outputPath, files) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    files.forEach(file => {
      archive.append(file.data, { name: file.name });
    });

    archive.finalize();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Web Content Extractor running on http://0.0.0.0:${PORT}`);
  console.log('Ready to extract web content!');
});
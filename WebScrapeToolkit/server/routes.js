import { createServer } from "http";
import { storage } from "./storage.js";
import { scraperService } from "./services/scraper.js";
import { videoDownloaderService } from "./services/videoDownloader.js";
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../temp');

// Ensure temp directory exists
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

// Validation schemas
const googleSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

const webpageCaptureSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

const videoDownloadSchema = z.object({
  url: z.string().url("Please enter a valid video URL"),
  quality: z.string().default("best"),
  format: z.string().default("mp4"),
});

export async function registerRoutes(app) {
  
  // Google Search endpoint
  app.post("/api/google-search", async (req, res) => {
    try {
      const input = googleSearchSchema.parse(req.body);
      
      // Create job
      const job = await storage.createJob({
        type: "google-search",
        input,
      });

      // Process in background
      processGoogleSearch(job.id, input.query);

      res.json({ jobId: job.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Webpage capture endpoint
  app.post("/api/webpage-capture", async (req, res) => {
    try {
      const input = webpageCaptureSchema.parse(req.body);
      
      const job = await storage.createJob({
        type: "webpage-capture",
        input,
      });

      processWebpageCapture(job.id, input.url);

      res.json({ jobId: job.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Video download endpoint
  app.post("/api/video-download", async (req, res) => {
    try {
      const input = videoDownloadSchema.parse(req.body);
      
      if (!videoDownloaderService.isVideoUrl(input.url)) {
        return res.status(400).json({ error: "URL does not appear to be a direct video link" });
      }
      
      const job = await storage.createJob({
        type: "video-download",
        input,
      });

      processVideoDownload(job.id, input.url, input.format);

      res.json({ jobId: job.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Job status endpoint
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download endpoint
  app.get("/api/download/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job || job.status !== "completed" || !job.outputPath) {
        return res.status(404).json({ error: "File not found or not ready" });
      }

      const filePath = path.join(tempDir, job.outputPath);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: "File not found" });
      }

      // Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${job.outputPath}"`);
      
      // Stream file
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);

      // Clean up file after sending (with delay to ensure download completes)
      setTimeout(async () => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error cleaning up file:', error);
        }
      }, 30000); // 30 second delay

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing functions
async function processGoogleSearch(jobId, query) {
  try {
    await storage.updateJobStatus(jobId, "processing");
    
    const { screenshot, html } = await scraperService.captureGoogleSearch(query);
    
    // Create ZIP file
    const zipFileName = `google-search-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    await createZipFile(zipPath, [
      { name: 'screenshot.png', data: screenshot },
      { name: 'search-results.html', data: Buffer.from(html, 'utf8') }
    ]);
    
    await storage.updateJobStatus(jobId, "completed", zipFileName);
  } catch (error) {
    console.error('Google search processing error:', error);
    await storage.updateJobStatus(jobId, "failed", undefined, error.message);
  }
}

async function processWebpageCapture(jobId, url) {
  try {
    await storage.updateJobStatus(jobId, "processing");
    
    const { screenshot, html } = await scraperService.captureWebpage(url);
    
    const zipFileName = `webpage-capture-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    await createZipFile(zipPath, [
      { name: 'screenshot.png', data: screenshot },
      { name: 'webpage.html', data: Buffer.from(html, 'utf8') }
    ]);
    
    await storage.updateJobStatus(jobId, "completed", zipFileName);
  } catch (error) {
    console.error('Webpage capture processing error:', error);
    await storage.updateJobStatus(jobId, "failed", undefined, error.message);
  }
}

async function processVideoDownload(jobId, url, format) {
  try {
    await storage.updateJobStatus(jobId, "processing");
    
    const videoFileName = videoDownloaderService.getVideoFileName(url, format);
    const videoPath = path.join(tempDir, `temp-${jobId}-${videoFileName}`);
    
    await videoDownloaderService.downloadVideo(url, videoPath);
    
    const zipFileName = `video-download-${jobId}-${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);
    
    const videoData = await fs.readFile(videoPath);
    
    await createZipFile(zipPath, [
      { name: videoFileName, data: videoData }
    ]);
    
    // Clean up temp video file
    await fs.unlink(videoPath);
    
    await storage.updateJobStatus(jobId, "completed", zipFileName);
  } catch (error) {
    console.error('Video download processing error:', error);
    await storage.updateJobStatus(jobId, "failed", undefined, error.message);
  }
}

async function createZipFile(outputPath, files) {
  return new Promise((resolve, reject) => {
    const output = require('fs').createWriteStream(outputPath);
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
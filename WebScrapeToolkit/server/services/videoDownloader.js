import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

export class VideoDownloaderService {
  async downloadVideo(url, outputPath) {
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
            // Handle redirects
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              file.close();
              fs.unlink(outputPath, () => {});
              this.downloadVideo(redirectUrl, outputPath).then(resolve).catch(reject);
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

  getVideoFileName(url, format = 'mp4') {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const filename = path.basename(pathname) || 'video';
      
      // Remove existing extension and add the desired format
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return `${nameWithoutExt}.${format}`;
    } catch {
      return `video.${format}`;
    }
  }

  isVideoUrl(url) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.toLowerCase();
      return videoExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }
}

export const videoDownloaderService = new VideoDownloaderService();
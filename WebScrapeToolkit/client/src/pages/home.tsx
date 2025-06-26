import { Download, Shield, Bolt, FileArchive } from "lucide-react";
import GoogleSearchExtractor from "@/components/GoogleSearchExtractor";
import WebpageExtractor from "@/components/WebpageExtractor";
import VideoDownloader from "@/components/VideoDownloader";

export default function Home() {
  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Download className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Web Content Extractor</h1>
                <p className="text-sm text-gray-500">Screenshots, HTML & Video Downloads</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure Processing</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Extract Web Content in Seconds</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Capture screenshots, download HTML files, and extract videos from the web. 
            All results are packaged in convenient ZIP files for easy download.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <GoogleSearchExtractor />
          <WebpageExtractor />
          <VideoDownloader />
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Service?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bolt className="text-blue-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600 text-sm">Process requests quickly with optimized capture and download speeds.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-green-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
                <p className="text-gray-600 text-sm">Your data is processed securely and files are automatically cleaned up.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileArchive className="text-purple-600 text-2xl" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">ZIP Packaging</h4>
                <p className="text-gray-600 text-sm">All results conveniently packaged in organized ZIP files for download.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-100 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Backend Technologies</h4>
              <ul className="space-y-1">
                <li>• Node.js with Express framework</li>
                <li>• Puppeteer for web scraping and screenshots</li>
                <li>• Native Node.js for video downloading</li>
                <li>• Archiver for ZIP file creation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features</h4>
              <ul className="space-y-1">
                <li>• Input validation and sanitization</li>
                <li>• Automatic file cleanup</li>
                <li>• Progress tracking and error handling</li>
                <li>• Support for multiple video formats</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Built with Node.js, Puppeteer, and modern web technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

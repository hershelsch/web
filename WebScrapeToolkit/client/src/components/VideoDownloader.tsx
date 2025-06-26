import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Video, Download, Loader2, CheckCircle, AlertTriangle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job } from "@shared/schema";

export default function VideoDownloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoQuality, setVideoQuality] = useState("best");
  const [videoFormat, setVideoFormat] = useState("mp4");
  const [jobId, setJobId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ["/api/jobs", jobId],
    enabled: jobId !== null,
    refetchInterval: (data) => {
      const job = data as Job | null;
      return job?.status === "processing" || job?.status === "pending" ? 2000 : false;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { url: string; quality: string; format: string }) => {
      const response = await apiRequest("POST", "/api/video-download", data);
      return response.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast({
        title: "Download Started",
        description: "Processing your video download...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start video download",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim()) {
      mutation.mutate({ 
        url: videoUrl.trim(),
        quality: videoQuality,
        format: videoFormat
      });
    }
  };

  const handleDownload = () => {
    if (job?.id) {
      window.open(`/api/download/${job.id}`, '_blank');
    }
  };

  const isProcessing = mutation.isPending || job?.status === "processing" || job?.status === "pending";
  const isCompleted = job?.status === "completed";
  const isFailed = job?.status === "failed";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Video className="text-purple-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video Download</h3>
            <p className="text-sm text-gray-500">Direct video file</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Enter a direct video URL and get a ZIP file containing the downloaded video file.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-4 py-3 pr-10"
              required
              disabled={isProcessing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Play className="text-gray-400 h-4 w-4" />
            </div>
          </div>

          {/* Video format selector */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={videoQuality} onValueChange={setVideoQuality} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best Quality</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="360p">360p</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={videoFormat} onValueChange={setVideoFormat} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="avi">AVI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit"
            disabled={isProcessing || !videoUrl.trim()}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Video</span>
              </>
            )}
          </Button>
        </form>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Downloading video...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {(isCompleted || isFailed) && (
          <div className="mt-4">
            {isCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Video downloaded successfully!</span>
                  </div>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}
            
            {isFailed && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    {job?.error || "Video download failed. Check URL and format support."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

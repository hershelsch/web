import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Globe, Camera, Loader2, CheckCircle, AlertTriangle, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job } from "@shared/schema";

export default function WebpageExtractor() {
  const [webpageUrl, setWebpageUrl] = useState("");
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
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/webpage-capture", { url });
      return response.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast({
        title: "Capture Started",
        description: "Processing your webpage...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start webpage capture",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (webpageUrl.trim()) {
      mutation.mutate(webpageUrl.trim());
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
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Globe className="text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Webpage Capture</h3>
            <p className="text-sm text-gray-500">Screenshot + HTML</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Enter any URL and get a ZIP file containing both a screenshot and HTML source of the webpage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              value={webpageUrl}
              onChange={(e) => setWebpageUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 pr-10"
              required
              disabled={isProcessing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Link className="text-gray-400 h-4 w-4" />
            </div>
          </div>

          <Button 
            type="submit"
            disabled={isProcessing || !webpageUrl.trim()}
            className="w-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Capture Webpage</span>
              </>
            )}
          </Button>
        </form>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading webpage...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
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
                    <span className="text-sm text-green-800">ZIP file ready for download!</span>
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
                    {job?.error || "Invalid URL or capture failed. Please try again."}
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

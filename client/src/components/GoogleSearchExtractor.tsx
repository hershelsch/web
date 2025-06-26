import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, Camera, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job } from "@shared/schema";

export default function GoogleSearchExtractor() {
  const [searchQuery, setSearchQuery] = useState("");
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
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/google-search", { query });
      return response.json();
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      toast({
        title: "Search Started",
        description: "Processing your Google search...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start search",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      mutation.mutate(searchQuery.trim());
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
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Search className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Search Capture</h3>
            <p className="text-sm text-gray-500">Screenshot + HTML</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Enter any search term and get a ZIP file containing both a screenshot and HTML of Google search results.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search term..."
              className="w-full px-4 py-3 pr-10"
              required
              disabled={isProcessing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="text-gray-400 h-4 w-4" />
            </div>
          </div>

          <Button 
            type="submit"
            disabled={isProcessing || !searchQuery.trim()}
            className="w-full bg-primary text-white hover:bg-blue-600 flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Capture Search Results</span>
              </>
            )}
          </Button>
        </form>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing search...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
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
                    {job?.error || "Search failed. Please try again."}
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

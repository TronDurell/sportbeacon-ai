import { fetchWithAuth } from './api';

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  size: number;
  format: string;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  tags: string[];
}

export interface AnalysisResult {
  timestamp: string;
  type: 'technique' | 'performance' | 'safety' | 'highlight';
  confidence: number;
  description: string;
  recommendations?: string[];
  keyframes?: {
    timestamp: number;
    imageUrl: string;
    annotation?: string;
  }[];
}

export interface UploadProgress {
  progress: number;
  speed: number;
  remaining: number;
}

class VideoUploadService {
  private readonly CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
  private abortControllers: Map<string, AbortController> = new Map();

  async uploadVideo(
    file: File,
    metadata: Omit<
      VideoMetadata,
      'id' | 'status' | 'uploadDate' | 'duration' | 'size' | 'format'
    >,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoMetadata> {
    // Get upload URL and video ID
    const initResponse = await fetchWithAuth('/api/videos/init', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        ...metadata,
      }),
    });

    const { uploadUrl, videoId } = await initResponse.json();

    // Create abort controller for this upload
    const abortController = new AbortController();
    this.abortControllers.set(videoId, abortController);

    try {
      // Upload file in chunks
      const chunks = Math.ceil(file.size / this.CHUNK_SIZE);
      let uploadedChunks = 0;
      let startTime = Date.now();

      for (let i = 0; i < chunks; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await fetchWithAuth(`${uploadUrl}/${i}`, {
          method: 'PUT',
          body: chunk,
          signal: abortController.signal,
        });

        uploadedChunks++;
        if (onProgress) {
          const progress = (uploadedChunks / chunks) * 100;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = start / elapsed / (1024 * 1024); // MB/s
          const remaining = Math.round((elapsed / progress) * (100 - progress));

          onProgress({
            progress,
            speed,
            remaining,
          });
        }
      }

      // Complete upload
      const completeResponse = await fetchWithAuth(
        `/api/videos/${videoId}/complete`,
        {
          method: 'POST',
        }
      );

      return completeResponse.json();
    } finally {
      this.abortControllers.delete(videoId);
    }
  }

  cancelUpload(videoId: string): void {
    const controller = this.abortControllers.get(videoId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(videoId);
    }
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const response = await fetchWithAuth(`/api/videos/${videoId}`);
    return response.json();
  }

  async requestAnalysis(
    videoId: string,
    types: string[]
  ): Promise<{
    analysisId: string;
    estimatedDuration: number;
  }> {
    const response = await fetchWithAuth(`/api/videos/${videoId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ types }),
    });
    return response.json();
  }

  async getAnalysisResults(
    videoId: string,
    analysisId: string
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    results?: AnalysisResult[];
    error?: string;
  }> {
    const response = await fetchWithAuth(
      `/api/videos/${videoId}/analysis/${analysisId}`
    );
    return response.json();
  }

  async generateThumbnail(
    videoId: string,
    timestamp: number
  ): Promise<{
    thumbnailUrl: string;
  }> {
    const response = await fetchWithAuth(`/api/videos/${videoId}/thumbnail`, {
      method: 'POST',
      body: JSON.stringify({ timestamp }),
    });
    return response.json();
  }

  async updateMetadata(
    videoId: string,
    metadata: Partial<Pick<VideoMetadata, 'title' | 'description' | 'tags'>>
  ): Promise<VideoMetadata> {
    const response = await fetchWithAuth(`/api/videos/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
    return response.json();
  }

  async deleteVideo(videoId: string): Promise<void> {
    await fetchWithAuth(`/api/videos/${videoId}`, {
      method: 'DELETE',
    });
  }
}

export const videoUploadService = new VideoUploadService();

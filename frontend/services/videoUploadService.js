import { fetchWithAuth } from './api';
class VideoUploadService {
    CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
    abortControllers = new Map();
    async uploadVideo(file, metadata, onProgress) {
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
            const startTime = Date.now();
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
                    const speed = (start / elapsed) / (1024 * 1024); // MB/s
                    const remaining = Math.round((elapsed / progress) * (100 - progress));
                    onProgress({
                        progress,
                        speed,
                        remaining,
                    });
                }
            }
            // Complete upload
            const completeResponse = await fetchWithAuth(`/api/videos/${videoId}/complete`, {
                method: 'POST',
            });
            return completeResponse.json();
        }
        finally {
            this.abortControllers.delete(videoId);
        }
    }
    cancelUpload(videoId) {
        const controller = this.abortControllers.get(videoId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(videoId);
        }
    }
    async getVideoMetadata(videoId) {
        const response = await fetchWithAuth(`/api/videos/${videoId}`);
        return response.json();
    }
    async requestAnalysis(videoId, types) {
        const response = await fetchWithAuth(`/api/videos/${videoId}/analyze`, {
            method: 'POST',
            body: JSON.stringify({ types }),
        });
        return response.json();
    }
    async getAnalysisResults(videoId, analysisId) {
        const response = await fetchWithAuth(`/api/videos/${videoId}/analysis/${analysisId}`);
        return response.json();
    }
    async generateThumbnail(videoId, timestamp) {
        const response = await fetchWithAuth(`/api/videos/${videoId}/thumbnail`, {
            method: 'POST',
            body: JSON.stringify({ timestamp }),
        });
        return response.json();
    }
    async updateMetadata(videoId, metadata) {
        const response = await fetchWithAuth(`/api/videos/${videoId}`, {
            method: 'PATCH',
            body: JSON.stringify(metadata),
        });
        return response.json();
    }
    async deleteVideo(videoId) {
        await fetchWithAuth(`/api/videos/${videoId}`, {
            method: 'DELETE',
        });
    }
}
export const videoUploadService = new VideoUploadService();

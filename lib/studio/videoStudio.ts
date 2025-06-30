import { VideoProject, VideoCategory, ProjectStatus, VideoAsset, VideoMetadata } from './types';
import { analytics } from '../ai/shared/analytics';

export class VideoStudio {
  private projects: Map<string, VideoProject> = new Map();

  async createProject(userId: string, config: any): Promise<VideoProject> {
    try {
      const projectId = this.generateProjectId();
      
      const project: VideoProject = {
        id: projectId,
        userId,
        title: config.title || 'Untitled Project',
        description: config.description || '',
        category: config.category || 'sports_highlight',
        status: 'draft',
        assets: [],
        metadata: {
          tags: config.tags || [],
          participants: config.participants || [],
          equipment: config.equipment || [],
          date: new Date()
        },
        analytics: {
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          watchTime: 0,
          engagementRate: 0,
          audienceRetention: 0,
          demographics: {
            ageGroups: {},
            locations: {},
            devices: {}
          }
        },
        monetization: {
          enabled: false,
          tier: null,
          revenue: 0,
          subscribers: 0,
          sponsorships: [],
          adRevenue: 0,
          tips: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.projects.set(projectId, project);

      await analytics.track('video_project_created', {
        userId,
        projectId,
        category: project.category,
        timestamp: new Date().toISOString()
      });

      return project;
    } catch (error) {
      await analytics.track('video_project_creation_failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async publish(projectId: string): Promise<string> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Validate project for publishing
      await this.validateForPublishing(project);

      // Update status
      project.status = 'published';
      project.updatedAt = new Date();

      // Generate publish URL
      const publishUrl = `https://sportbeacon.ai/studio/videos/${projectId}`;

      await analytics.track('video_published', {
        userId: project.userId,
        projectId,
        category: project.category,
        publishUrl,
        timestamp: new Date().toISOString()
      });

      return publishUrl;
    } catch (error) {
      await analytics.track('video_publish_failed', {
        projectId,
        error: error.message
      });
      throw error;
    }
  }

  private async validateForPublishing(project: VideoProject): Promise<void> {
    const errors: string[] = [];

    // Check required fields
    if (!project.title.trim()) {
      errors.push('Title is required');
    }

    if (!project.description.trim()) {
      errors.push('Description is required');
    }

    if (project.assets.length === 0) {
      errors.push('At least one video asset is required');
    }

    // Check content moderation
    if (await this.needsModeration(project)) {
      project.status = 'review';
      throw new Error('Content requires moderation review');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private async needsModeration(project: VideoProject): Promise<boolean> {
    // Simple content moderation check
    const sensitiveWords = ['inappropriate', 'sensitive', 'moderate'];
    const content = `${project.title} ${project.description}`.toLowerCase();
    
    return sensitiveWords.some(word => content.includes(word));
  }

  async addAsset(projectId: string, asset: VideoAsset): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Validate asset
      await this.validateAsset(asset);

      project.assets.push(asset);
      project.updatedAt = new Date();

      await analytics.track('video_asset_added', {
        projectId,
        assetType: asset.type,
        assetSize: asset.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('video_asset_add_failed', {
        projectId,
        error: error.message
      });
      throw error;
    }
  }

  private async validateAsset(asset: VideoAsset): Promise<void> {
    const maxSize = 500; // 500MB
    const allowedFormats = ['mp4', 'mov', 'avi', 'mkv'];

    if (asset.size > maxSize * 1024 * 1024) {
      throw new Error(`Asset size exceeds maximum limit of ${maxSize}MB`);
    }

    const format = asset.format.toLowerCase();
    if (!allowedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  async updateMetadata(projectId: string, metadata: Partial<VideoMetadata>): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      Object.assign(project.metadata, metadata);
      project.updatedAt = new Date();

      await analytics.track('video_metadata_updated', {
        projectId,
        updatedFields: Object.keys(metadata),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('video_metadata_update_failed', {
        projectId,
        error: error.message
      });
      throw error;
    }
  }

  async getProject(projectId: string): Promise<VideoProject | null> {
    const project = this.projects.get(projectId);
    
    if (project) {
      await analytics.track('video_project_accessed', {
        projectId,
        status: project.status,
        timestamp: new Date().toISOString()
      });
    }

    return project || null;
  }

  async getUserProjects(userId: string): Promise<VideoProject[]> {
    const userProjects = Array.from(this.projects.values())
      .filter(project => project.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    await analytics.track('user_projects_accessed', {
      userId,
      projectsCount: userProjects.length,
      timestamp: new Date().toISOString()
    });

    return userProjects;
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      this.projects.delete(projectId);

      await analytics.track('video_project_deleted', {
        userId: project.userId,
        projectId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('video_project_deletion_failed', {
        projectId,
        error: error.message
      });
      throw error;
    }
  }

  private generateProjectId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async getStudioAnalytics(): Promise<any> {
    const projects = Array.from(this.projects.values());
    
    const analytics = {
      totalProjects: projects.length,
      publishedVideos: projects.filter(p => p.status === 'published').length,
      totalViews: projects.reduce((sum, p) => sum + p.analytics.views, 0),
      totalRevenue: projects.reduce((sum, p) => sum + p.monetization.revenue, 0),
      activeCreators: new Set(projects.map(p => p.userId)).size,
      averageEngagement: 0,
      topCategories: {} as Record<VideoCategory, number>,
      trendingTags: [] as string[]
    };

    // Calculate average engagement
    const publishedProjects = projects.filter(p => p.status === 'published');
    if (publishedProjects.length > 0) {
      analytics.averageEngagement = publishedProjects.reduce((sum, p) => 
        sum + p.analytics.engagementRate, 0) / publishedProjects.length;
    }

    // Top categories
    for (const project of projects) {
      analytics.topCategories[project.category] = 
        (analytics.topCategories[project.category] || 0) + 1;
    }

    // Trending tags
    const allTags = projects.flatMap(p => p.metadata.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    analytics.trendingTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    return analytics;
  }
} 
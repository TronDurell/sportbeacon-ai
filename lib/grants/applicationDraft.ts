import { ApplicationDraft, ApplicationSection, DraftStatus, GrantOpportunity } from './types';
import { analytics } from '../ai/shared/analytics';

export class ApplicationDraftService {
  async generateDraft(grantId: string, organizationData: any): Promise<ApplicationDraft> {
    try {
      const sections = await this.createApplicationSections(grantId, organizationData);
      const completionPercentage = this.calculateCompletion(sections);
      const estimatedTime = this.estimateCompletionTime(sections);

      const draft: ApplicationDraft = {
        grantId,
        sections,
        completionPercentage,
        estimatedTimeToComplete: estimatedTime,
        lastUpdated: new Date(),
        status: 'draft'
      };

      await analytics.track('application_draft_generated', {
        grantId,
        sectionsCount: sections.length,
        completionPercentage,
        estimatedTime,
        timestamp: new Date().toISOString()
      });

      return draft;
    } catch (error) {
      await analytics.track('application_draft_failed', {
        grantId,
        error: error.message
      });
      throw error;
    }
  }

  private async createApplicationSections(grantId: string, organizationData: any): Promise<ApplicationSection[]> {
    const sections: ApplicationSection[] = [
      {
        id: 'organization-overview',
        title: 'Organization Overview',
        content: this.generateOrganizationOverview(organizationData),
        required: true,
        completed: true,
        wordLimit: 500,
        currentWordCount: this.countWords(this.generateOrganizationOverview(organizationData))
      },
      {
        id: 'project-description',
        title: 'Project Description',
        content: this.generateProjectDescription(grantId, organizationData),
        required: true,
        completed: false,
        wordLimit: 1000,
        currentWordCount: this.countWords(this.generateProjectDescription(grantId, organizationData))
      },
      {
        id: 'budget-breakdown',
        title: 'Budget Breakdown',
        content: this.generateBudgetBreakdown(organizationData),
        required: true,
        completed: false,
        wordLimit: 750,
        currentWordCount: this.countWords(this.generateBudgetBreakdown(organizationData))
      },
      {
        id: 'timeline',
        title: 'Project Timeline',
        content: this.generateTimeline(organizationData),
        required: true,
        completed: false,
        wordLimit: 500,
        currentWordCount: this.countWords(this.generateTimeline(organizationData))
      },
      {
        id: 'impact-measurement',
        title: 'Impact Measurement',
        content: this.generateImpactMeasurement(organizationData),
        required: true,
        completed: false,
        wordLimit: 600,
        currentWordCount: this.countWords(this.generateImpactMeasurement(organizationData))
      },
      {
        id: 'sustainability',
        title: 'Sustainability Plan',
        content: this.generateSustainabilityPlan(organizationData),
        required: false,
        completed: false,
        wordLimit: 400,
        currentWordCount: this.countWords(this.generateSustainabilityPlan(organizationData))
      }
    ];

    return sections;
  }

  private generateOrganizationOverview(orgData: any): string {
    return `${orgData.name} is a ${orgData.type} organization established in ${orgData.establishedYear}. 
    We serve ${orgData.targetPopulation} in ${orgData.serviceArea} with a mission to ${orgData.mission}. 
    Our organization has ${orgData.staffCount} staff members and serves approximately ${orgData.annualParticipants} participants annually.`;
  }

  private generateProjectDescription(grantId: string, orgData: any): string {
    return `This project aims to [PROJECT DESCRIPTION NEEDED]. 
    Through this initiative, we will [OBJECTIVES NEEDED]. 
    The project will directly benefit [TARGET POPULATION NEEDED] by [BENEFITS NEEDED]. 
    We will measure success through [METRICS NEEDED].`;
  }

  private generateBudgetBreakdown(orgData: any): string {
    return `Total Project Budget: $[AMOUNT NEEDED]
    
    Personnel: $[AMOUNT NEEDED] (X%)
    Equipment: $[AMOUNT NEEDED] (X%)
    Facilities: $[AMOUNT NEEDED] (X%)
    Marketing: $[AMOUNT NEEDED] (X%)
    Administrative: $[AMOUNT NEEDED] (X%)
    
    Requested Grant Amount: $[AMOUNT NEEDED]
    Matching Funds: $[AMOUNT NEEDED]`;
  }

  private generateTimeline(orgData: any): string {
    return `Month 1-3: [PLANNING PHASE NEEDED]
    Month 4-6: [IMPLEMENTATION PHASE NEEDED]
    Month 7-9: [EVALUATION PHASE NEEDED]
    Month 10-12: [REPORTING PHASE NEEDED]`;
  }

  private generateImpactMeasurement(orgData: any): string {
    return `We will measure impact through:
    1. [METRIC 1 NEEDED]
    2. [METRIC 2 NEEDED]
    3. [METRIC 3 NEEDED]
    
    Data collection methods: [METHODS NEEDED]
    Reporting frequency: [FREQUENCY NEEDED]`;
  }

  private generateSustainabilityPlan(orgData: any): string {
    return `To ensure long-term sustainability, we will:
    1. [STRATEGY 1 NEEDED]
    2. [STRATEGY 2 NEEDED]
    3. [STRATEGY 3 NEEDED]`;
  }

  private calculateCompletion(sections: ApplicationSection[]): number {
    const completedSections = sections.filter(section => section.completed).length;
    return Math.round((completedSections / sections.length) * 100);
  }

  private estimateCompletionTime(sections: ApplicationSection[]): number {
    const incompleteSections = sections.filter(section => !section.completed);
    return incompleteSections.length * 30; // 30 minutes per section
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  async updateSection(draftId: string, sectionId: string, content: string): Promise<void> {
    await analytics.track('application_section_updated', {
      draftId,
      sectionId,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });
  }

  async submitApplication(draftId: string): Promise<void> {
    await analytics.track('application_submitted', {
      draftId,
      timestamp: new Date().toISOString()
    });
  }
} 
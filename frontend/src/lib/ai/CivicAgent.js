import { analyticsTracker } from "../analytics/eventTracking";
class CivicAgent {
    municipality;
    adminRole;
    sessionId;
    constructor(municipalityName, leaguePolicy, adminRole) {
        this.municipality = this.loadMunicipalityConfig(municipalityName, leaguePolicy);
        this.adminRole = adminRole;
        this.sessionId = `civic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Track agent initialization
        analyticsTracker.trackEvent({
            eventName: "civic_agent_init",
            eventParams: {
                municipality: municipalityName,
                adminRole,
                sessionId: this.sessionId
            },
            timestamp: new Date(),
            feature: "CivicAgent",
            category: "feature_usage"
        });
    }
    loadMunicipalityConfig(name, policies) {
        // Mock municipality data - in production, this would load from Firestore
        const mockFacilities = [
            {
                id: "facility-1",
                name: "Cary Community Center",
                type: "indoor",
                sports: ["basketball", "volleyball", "badminton"],
                address: "123 Main St, Cary, NC",
                coordinates: { lat: 35.7915, lng: -78.7811 },
                capacity: 200,
                amenities: ["parking", "locker rooms", "equipment rental"],
                availability: this.generateMockSchedule()
            },
            {
                id: "facility-2",
                name: "Cary Soccer Complex",
                type: "outdoor",
                sports: ["soccer", "football"],
                address: "456 Sports Ave, Cary, NC",
                coordinates: { lat: 35.7920, lng: -78.7820 },
                capacity: 500,
                amenities: ["parking", "concession stand", "bleachers"],
                availability: this.generateMockSchedule()
            }
        ];
        return {
            name,
            state: "NC",
            population: 175000,
            sportsFacilities: mockFacilities,
            leaguePolicies: policies,
            contactInfo: {
                phone: "(919) 469-4000",
                email: "parks@cary.gov",
                website: "https://www.cary.gov/parks",
                officeHours: "Mon-Fri 8AM-5PM",
                address: "316 N Academy St, Cary, NC 27513"
            }
        };
    }
    generateMockSchedule() {
        const timeSlots = [
            { startTime: "09:00", endTime: "12:00", available: true },
            { startTime: "13:00", endTime: "17:00", available: true },
            { startTime: "18:00", endTime: "22:00", available: true }
        ];
        return {
            monday: timeSlots,
            tuesday: timeSlots,
            wednesday: timeSlots,
            thursday: timeSlots,
            friday: timeSlots,
            saturday: timeSlots,
            sunday: timeSlots
        };
    }
    /**
     * Main query handler for civic questions
     */
    async handleQuery(query) {
        // Track query
        analyticsTracker.trackEvent({
            eventName: "civic_query",
            eventParams: {
                queryType: query.type,
                question: query.question,
                sessionId: this.sessionId
            },
            timestamp: new Date(),
            feature: "CivicAgent",
            category: "user_interaction"
        });
        switch (query.type) {
            case "policy":
                return this.handlePolicyQuery(query);
            case "registration":
                return this.handleRegistrationQuery(query);
            case "facility":
                return this.handleFacilityQuery(query);
            case "recommendation":
                return this.handleRecommendationQuery(query);
            case "general":
                return this.handleGeneralQuery(query);
            default:
                return this.handleGeneralQuery(query);
        }
    }
    /**
     * Handle policy-related queries
     */
    async handlePolicyQuery(query) {
        const question = query.question.toLowerCase();
        let relevantPolicies = [];
        let answer = "";
        // Search for relevant policies
        if (question.includes("refund") || question.includes("money back")) {
            relevantPolicies = this.municipality.leaguePolicies.filter(p => p.refundPolicy);
            answer = `Refund Policy: ${relevantPolicies[0]?.refundPolicy || "Contact our office for refund requests."}`;
        }
        else if (question.includes("age") || question.includes("old")) {
            relevantPolicies = this.municipality.leaguePolicies;
            const ageGroups = relevantPolicies.flatMap(p => p.ageGroups);
            answer = `Age Groups: ${ageGroups.map(ag => `${ag.name} (${ag.minAge}-${ag.maxAge})`).join(", ")}`;
        }
        else if (question.includes("cost") || question.includes("price") || question.includes("fee")) {
            relevantPolicies = this.municipality.leaguePolicies;
            answer = `League Costs: ${relevantPolicies.map(p => `${p.sport}: $${p.cost}`).join(", ")}`;
        }
        else if (question.includes("sibling") || question.includes("brother") || question.includes("sister")) {
            relevantPolicies = this.municipality.leaguePolicies.filter(p => p.siblingDiscount > 0);
            answer = `Sibling Discount: ${relevantPolicies[0]?.siblingDiscount || 0}% off for additional siblings`;
        }
        else {
            answer = "For specific policy questions, please contact our office or visit our website.";
        }
        return {
            answer,
            confidence: 0.85,
            sources: [`${this.municipality.name} Parks & Recreation Policies`],
            relatedPolicies: relevantPolicies,
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Handle registration-related queries
     */
    async handleRegistrationQuery(query) {
        const { childAge, sport } = query.context || {};
        let answer = "";
        let recommendedPolicies = [];
        if (childAge && sport) {
            recommendedPolicies = this.municipality.leaguePolicies.filter(p => p.sport.toLowerCase() === sport.toLowerCase() &&
                p.ageGroups.some(ag => childAge >= ag.minAge && childAge <= ag.maxAge));
            if (recommendedPolicies.length > 0) {
                const policy = recommendedPolicies[0];
                answer = `Registration for ${sport} (age ${childAge}): Cost $${policy.cost}, Registration deadline: ${policy.registrationDeadlines[0]?.toLocaleDateString()}`;
            }
            else {
                answer = `No ${sport} leagues available for age ${childAge}. Please check our website for other options.`;
            }
        }
        else {
            answer = "Please provide your child's age and preferred sport for specific registration information.";
        }
        return {
            answer,
            confidence: 0.9,
            sources: [`${this.municipality.name} Registration System`],
            relatedPolicies: recommendedPolicies,
            nextSteps: ["Visit our website to register", "Call our office for assistance"],
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Handle facility-related queries
     */
    async handleFacilityQuery(query) {
        const { sport, location } = query.context || {};
        let relevantFacilities = [];
        if (sport) {
            relevantFacilities = this.municipality.sportsFacilities.filter(f => f.sports.some(s => s.toLowerCase().includes(sport.toLowerCase())));
        }
        else {
            relevantFacilities = this.municipality.sportsFacilities;
        }
        const answer = relevantFacilities.length > 0
            ? `Available facilities: ${relevantFacilities.map(f => f.name).join(", ")}`
            : "No facilities found for your request.";
        return {
            answer,
            confidence: 0.95,
            sources: [`${this.municipality.name} Facility Database`],
            recommendedFacilities: relevantFacilities,
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Handle recommendation queries
     */
    async handleRecommendationQuery(query) {
        const { childAge, skillLevel, budget } = query.context || {};
        let recommendations = [];
        if (childAge) {
            recommendations = this.municipality.leaguePolicies.filter(p => p.ageGroups.some(ag => childAge >= ag.minAge && childAge <= ag.maxAge) &&
                (!budget || p.cost <= budget));
            if (skillLevel) {
                recommendations = recommendations.filter(p => p.ageGroups.some(ag => ag.skillLevel === skillLevel));
            }
        }
        const answer = recommendations.length > 0
            ? `Recommended leagues: ${recommendations.map(p => `${p.sport} (${p.ageGroups[0].name})`).join(", ")}`
            : "No leagues match your criteria. Please contact our office for assistance.";
        return {
            answer,
            confidence: 0.8,
            sources: [`${this.municipality.name} League Recommendations`],
            relatedPolicies: recommendations,
            nextSteps: ["Review league details", "Contact us for more information"],
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Handle general queries
     */
    async handleGeneralQuery(query) {
        const answer = `Welcome to ${this.municipality.name} Parks & Recreation! I can help you with registration, policies, facilities, and league recommendations. What would you like to know?`;
        return {
            answer,
            confidence: 0.7,
            sources: [`${this.municipality.name} General Information`],
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Get onboarding assistant for new users
     */
    async getOnboardingAssistant() {
        const answer = `Welcome to ${this.municipality.name} Parks & Recreation! Here's how to get started:

1. **Browse Leagues**: Check our available sports leagues by age group
2. **Register Online**: Visit our website to register your child
3. **Contact Us**: Call or email us for assistance
4. **Visit Facilities**: Check out our sports facilities and amenities

What would you like to know more about?`;
        return {
            answer,
            confidence: 0.9,
            sources: [`${this.municipality.name} Onboarding Guide`],
            nextSteps: ["Browse leagues", "Register online", "Contact office"],
            contactInfo: this.municipality.contactInfo
        };
    }
    /**
     * Get policy lookup for specific questions
     */
    async getPolicyLookup(question) {
        return this.handleQuery({
            type: "policy",
            question,
            context: {}
        });
    }
    /**
     * Get league recommendations based on criteria
     */
    async getLeagueRecommendations(criteria) {
        return this.handleQuery({
            type: "recommendation",
            question: "Find leagues for my child",
            context: criteria
        });
    }
    /**
     * Get facility information and availability
     */
    async getFacilityInfo(sport, location) {
        return this.handleQuery({
            type: "facility",
            question: "Find sports facilities",
            context: { sport, location }
        });
    }
    /**
     * End session and log analytics
     */
    async endSession() {
        analyticsTracker.trackEvent({
            eventName: "civic_session_end",
            eventParams: {
                sessionId: this.sessionId,
                municipality: this.municipality.name,
                adminRole: this.adminRole
            },
            timestamp: new Date(),
            feature: "CivicAgent",
            category: "feature_usage"
        });
    }
}
export default CivicAgent;

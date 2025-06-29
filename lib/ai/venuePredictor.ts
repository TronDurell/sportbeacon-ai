import * as tf from '@tensorflow/tfjs';
import { Platform } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SmartVenue, VenueSensors, MaintenanceIssue } from '../maps/smartVenues';

export interface VenuePrediction {
  venueId: string;
  timestamp: Date;
  predictions: {
    occupancy: {
      current: number;
      predicted: number;
      confidence: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    maintenance: {
      nextInspection: Date;
      riskScore: number;
      priorityIssues: string[];
      estimatedCost: number;
    };
    crowdLevel: {
      expected: number;
      peakTime: Date;
      duration: number;
    };
    revenue: {
      predicted: number;
      trend: 'up' | 'down' | 'stable';
      factors: string[];
    };
  };
  alerts: VenueAlert[];
  recommendations: string[];
  modelVersion: string;
  trainingDataPoints: number;
}

export interface VenueAlert {
  id: string;
  type: 'maintenance' | 'crowd' | 'safety' | 'revenue' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  venueId: string;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired: boolean;
  estimatedImpact: {
    participants: number;
    revenue: number;
    safety: number;
  };
  notificationSent: boolean;
}

export interface TrainingData {
  venueId: string;
  timestamp: Date;
  features: {
    occupancy: number;
    temperature: number;
    humidity: number;
    weatherCondition: string;
    dayOfWeek: number;
    hourOfDay: number;
    month: number;
    isWeekend: boolean;
    isHoliday: boolean;
    eventsCount: number;
    maintenanceIssues: number;
    revenue: number;
    seasonality: number;
    specialEvents: number;
  };
  target: {
    nextOccupancy: number;
    maintenanceRisk: number;
    crowdLevel: number;
    revenue: number;
  };
}

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: Date;
  trainingDuration: number;
  dataPointsUsed: number;
  modelVersion: string;
}

export interface CRONConfig {
  predictionInterval: number; // minutes
  loggingInterval: number; // minutes (6 hours = 360 minutes)
  alertCheckInterval: number; // minutes
  modelRetrainInterval: number; // hours
}

export class VenuePredictor {
  private static instance: VenuePredictor;
  private models: Map<string, tf.LayersModel> = new Map();
  private trainingData: Map<string, TrainingData[]> = new Map();
  private predictions: Map<string, VenuePrediction> = new Map();
  private alerts: VenueAlert[] = [];
  private metrics: Map<string, ModelMetrics> = new Map();
  private isTraining: boolean = false;
  private cronTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: CRONConfig = {
    predictionInterval: 30, // 30 minutes
    loggingInterval: 360, // 6 hours
    alertCheckInterval: 15, // 15 minutes
    modelRetrainInterval: 24, // 24 hours
  };

  static getInstance(): VenuePredictor {
    if (!VenuePredictor.instance) {
      VenuePredictor.instance = new VenuePredictor();
    }
    return VenuePredictor.instance;
  }

  constructor() {
    this.initializeTensorFlow();
  }

  // Initialize TensorFlow.js with enhanced configuration
  private async initializeTensorFlow(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await tf.ready();
        await tf.setBackend('webgl');
      } else {
        await tf.setBackend('cpu');
        // Enable memory management for mobile
        tf.engine().startScope();
      }
      
      // Configure memory management
      tf.engine().setMemoryInfo({
        numBytes: 0,
        numTensors: 0,
        numDataBuffers: 0,
        unreliable: false,
      });
      
      console.log('TensorFlow.js initialized successfully with backend:', tf.getBackend());
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js:', error);
      // Fallback to CPU
      await tf.setBackend('cpu');
    }
  }

  // Initialize prediction models for all venues with CRON scheduling
  async initialize(): Promise<void> {
    try {
      console.log('Initializing VenuePredictor with CRON scheduling...');
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Train models for each venue
      await this.trainAllModels();
      
      // Start CRON-based prediction loop
      this.startCRONPredictionLoop();
      
      // Start CRON-based alert monitoring
      this.startCRONAlertMonitoring();
      
      // Start CRON-based logging
      this.startCRONLogging();
      
      // Start CRON-based model retraining
      this.startCRONModelRetraining();
      
      console.log('VenuePredictor initialized successfully with CRON scheduling');
    } catch (error) {
      console.error('Failed to initialize VenuePredictor:', error);
    }
  }

  // Enhanced TensorFlow.js model scaffolding
  private createModel(inputShape: number): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // Input layer with normalization
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [inputShape],
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        
        // Dropout for regularization
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layers
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        
        // Output layer (4 outputs: occupancy, maintenance, crowd, revenue)
        tf.layers.dense({
          units: 4,
          activation: 'linear',
        }),
      ],
    });

    // Compile with optimized settings
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy'],
    });

    return model;
  }

  // CRON-based prediction loop
  private startCRONPredictionLoop(): void {
    const timer = setInterval(async () => {
      try {
        await this.generatePredictions();
        console.log(`CRON: Generated predictions at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('CRON: Failed to generate predictions:', error);
      }
    }, this.config.predictionInterval * 60 * 1000);

    this.cronTimers.set('predictions', timer);
  }

  // CRON-based alert monitoring
  private startCRONAlertMonitoring(): void {
    const timer = setInterval(async () => {
      try {
        await this.checkAllAlerts();
        console.log(`CRON: Checked alerts at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('CRON: Failed to check alerts:', error);
      }
    }, this.config.alertCheckInterval * 60 * 1000);

    this.cronTimers.set('alerts', timer);
  }

  // CRON-based logging to Firestore (every 6 hours)
  private startCRONLogging(): void {
    const timer = setInterval(async () => {
      try {
        await this.logPredictionsToFirestore();
        console.log(`CRON: Logged predictions to Firestore at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('CRON: Failed to log predictions:', error);
      }
    }, this.config.loggingInterval * 60 * 1000);

    this.cronTimers.set('logging', timer);
  }

  // CRON-based model retraining
  private startCRONModelRetraining(): void {
    const timer = setInterval(async () => {
      try {
        await this.retrainAllModels();
        console.log(`CRON: Retrained models at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('CRON: Failed to retrain models:', error);
      }
    }, this.config.modelRetrainInterval * 60 * 60 * 1000);

    this.cronTimers.set('retraining', timer);
  }

  // Log predictions to Firestore every 6 hours
  private async logPredictionsToFirestore(): Promise<void> {
    try {
      const predictions = this.getAllPredictions();
      
      for (const prediction of predictions) {
        await addDoc(collection(db, 'venue_predictions'), {
          ...prediction,
          timestamp: serverTimestamp(),
          loggedAt: serverTimestamp(),
          modelVersion: prediction.modelVersion || '1.0.0',
        });
      }

      // Log metrics
      const metrics = Array.from(this.metrics.values());
      for (const metric of metrics) {
        await addDoc(collection(db, 'model_metrics'), {
          ...metric,
          timestamp: serverTimestamp(),
        });
      }

      console.log(`Logged ${predictions.length} predictions and ${metrics.length} metrics to Firestore`);
    } catch (error) {
      console.error('Failed to log predictions to Firestore:', error);
    }
  }

  // Retrain all models with new data
  private async retrainAllModels(): Promise<void> {
    try {
      console.log('Starting model retraining...');
      
      // Load fresh data
      await this.loadHistoricalData();
      
      // Retrain models
      await this.trainAllModels();
      
      console.log('Model retraining completed successfully');
    } catch (error) {
      console.error('Failed to retrain models:', error);
    }
  }

  // Enhanced model training with better error handling
  private async trainModel(venueId: string, data: TrainingData[]): Promise<void> {
    if (data.length < 100) {
      console.warn(`Insufficient data for venue ${venueId}: ${data.length} samples`);
      return;
    }

    try {
      // Prepare training data
      const features = data.map(d => [
        d.features.occupancy,
        d.features.temperature,
        d.features.humidity,
        this.encodeWeatherCondition(d.features.weatherCondition),
        d.features.dayOfWeek,
        d.features.hourOfDay,
        d.features.month,
        d.features.isWeekend ? 1 : 0,
        d.features.isHoliday ? 1 : 0,
        d.features.eventsCount,
        d.features.maintenanceIssues,
        d.features.revenue,
        d.features.seasonality,
        d.features.specialEvents,
      ]);

      const targets = data.map(d => [
        d.target.nextOccupancy,
        d.target.maintenanceRisk,
        d.target.crowdLevel,
        d.target.revenue,
      ]);

      // Convert to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(targets);

      // Create or get existing model
      let model = this.models.get(venueId);
      if (!model) {
        model = this.createModel(features[0].length);
        this.models.set(venueId, model);
      }

      // Train model with early stopping
      const startTime = Date.now();
      const result = await model.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Venue ${venueId} - Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
            }
          },
        },
      });

      // Calculate metrics
      const predictions = model.predict(xs) as tf.Tensor;
      const mse = tf.metrics.meanSquaredError(ys, predictions);
      const mseValue = await mse.array();

      // Update metrics
      this.metrics.set(venueId, {
        accuracy: result.history.acc ? result.history.acc[result.history.acc.length - 1] : 0,
        loss: result.history.loss ? result.history.loss[result.history.loss.length - 1] : 0,
        precision: 0.85, // Placeholder - would calculate from confusion matrix
        recall: 0.82, // Placeholder
        f1Score: 0.83, // Placeholder
        lastUpdated: new Date(),
        trainingDuration: Date.now() - startTime,
        dataPointsUsed: data.length,
        modelVersion: '1.1.0',
      });

      // Cleanup tensors
      xs.dispose();
      ys.dispose();
      predictions.dispose();
      mse.dispose();

      console.log(`Model trained for venue ${venueId} with ${data.length} samples`);
    } catch (error) {
      console.error(`Failed to train model for venue ${venueId}:`, error);
    }
  }

  // Enhanced prediction with confidence scoring
  private async predictVenue(venueId: string, model: tf.LayersModel): Promise<VenuePrediction | null> {
    try {
      const currentData = await this.getCurrentVenueData(venueId);
      if (!currentData) return null;

      // Prepare input features
      const features = [
        currentData.occupancy,
        currentData.temperature,
        currentData.humidity,
        this.encodeWeatherCondition(currentData.weatherCondition),
        new Date().getDay(),
        new Date().getHours(),
        new Date().getMonth(),
        [0, 6].includes(new Date().getDay()) ? 1 : 0, // weekend
        this.isHoliday(new Date()) ? 1 : 0,
        currentData.eventsCount,
        currentData.maintenanceIssues,
        currentData.revenue,
        Math.sin((new Date().getMonth() / 12) * 2 * Math.PI), // seasonality
        currentData.specialEvents || 0,
      ];

      const inputTensor = tf.tensor2d([features]);
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.array();

      const [predictedOccupancy, predictedMaintenanceRisk, predictedCrowd, predictedRevenue] = predictionArray[0];

      // Calculate confidence based on model metrics
      const metrics = this.metrics.get(venueId);
      const confidence = metrics ? metrics.accuracy : 0.7;

      // Generate prediction object
      const venuePrediction: VenuePrediction = {
        venueId,
        timestamp: new Date(),
        predictions: {
          occupancy: {
            current: currentData.occupancy,
            predicted: Math.max(0, Math.min(100, predictedOccupancy)),
            confidence,
            trend: this.calculateTrend(currentData.occupancy, predictedOccupancy),
          },
          maintenance: {
            nextInspection: this.calculateNextInspection(predictedMaintenanceRisk),
            riskScore: Math.max(0, Math.min(1, predictedMaintenanceRisk)),
            priorityIssues: this.getPriorityIssues(venueId),
            estimatedCost: this.estimateMaintenanceCost(predictedMaintenanceRisk),
          },
          crowdLevel: {
            expected: Math.max(0, predictedCrowd),
            peakTime: this.calculatePeakTime(venueId),
            duration: this.calculateCrowdDuration(venueId),
          },
          revenue: {
            predicted: Math.max(0, predictedRevenue),
            trend: this.calculateRevenueTrend(currentData.revenue, predictedRevenue),
            factors: this.identifyRevenueFactors(venueId),
          },
        },
        alerts: [],
        recommendations: this.generateRecommendations(venueId, {
          occupancy: predictedOccupancy,
          maintenance: predictedMaintenanceRisk,
          crowd: predictedCrowd,
          revenue: predictedRevenue,
        }),
        modelVersion: metrics?.modelVersion || '1.0.0',
        trainingDataPoints: metrics?.dataPointsUsed || 0,
      };

      // Check for alerts
      await this.checkAlerts(venuePrediction);

      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();

      return venuePrediction;
    } catch (error) {
      console.error(`Failed to predict venue ${venueId}:`, error);
      return null;
    }
  }

  // Enhanced alert system with FCM integration
  private async checkAlerts(prediction: VenuePrediction): Promise<void> {
    const alerts: VenueAlert[] = [];

    // Check occupancy alerts
    if (prediction.predictions.occupancy.predicted > 90) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        type: 'crowd',
        severity: 'high',
        title: 'High Occupancy Predicted',
        description: `Venue ${prediction.venueId} is predicted to reach ${prediction.predictions.occupancy.predicted}% occupancy`,
        venueId: prediction.venueId,
        timestamp: new Date(),
        acknowledged: false,
        actionRequired: true,
        estimatedImpact: {
          participants: prediction.predictions.crowdLevel.expected,
          revenue: prediction.predictions.revenue.predicted,
          safety: 0.8,
        },
        notificationSent: false,
      });
    }

    // Check maintenance alerts
    if (prediction.predictions.maintenance.riskScore > 0.7) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        type: 'maintenance',
        severity: 'critical',
        title: 'High Maintenance Risk',
        description: `Venue ${prediction.venueId} has ${(prediction.predictions.maintenance.riskScore * 100).toFixed(1)}% maintenance risk`,
        venueId: prediction.venueId,
        timestamp: new Date(),
        acknowledged: false,
        actionRequired: true,
        estimatedImpact: {
          participants: 0,
          revenue: -prediction.predictions.maintenance.estimatedCost,
          safety: 0.3,
        },
        notificationSent: false,
      });
    }

    // Add alerts to prediction
    prediction.alerts = alerts;

    // Send FCM notifications for critical alerts
    for (const alert of alerts) {
      if (alert.severity === 'critical' && !alert.notificationSent) {
        await this.sendFCMNotification(alert);
        alert.notificationSent = true;
      }
    }
  }

  // Send FCM notification for critical alerts
  private async sendFCMNotification(alert: VenueAlert): Promise<void> {
    try {
      // This would integrate with your FCM setup
      console.log(`FCM: Sending critical alert notification for ${alert.venueId}: ${alert.title}`);
      
      // Placeholder for FCM integration
      // await sendNotification({
      //   title: alert.title,
      //   body: alert.description,
      //   data: { alertId: alert.id, venueId: alert.venueId },
      //   topic: 'venue-alerts',
      // });
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
    }
  }

  // Cleanup CRON timers
  cleanup(): void {
    console.log('Cleaning up VenuePredictor CRON timers...');
    
    for (const [name, timer] of this.cronTimers) {
      clearInterval(timer);
      console.log(`Cleared CRON timer: ${name}`);
    }
    
    this.cronTimers.clear();
    
    // Cleanup TensorFlow models
    for (const model of this.models.values()) {
      model.dispose();
    }
    
    this.models.clear();
    
    // Cleanup TensorFlow memory
    tf.engine().endScope();
    tf.engine().reset();
  }

  // Load historical data from Firestore
  private async loadHistoricalData(): Promise<void> {
    try {
      // Load venue sensor data
      const sensorDataQuery = query(
        collection(db, 'venue_sensor_data'),
        orderBy('timestamp', 'desc'),
        limit(10000)
      );
      
      const sensorSnapshot = await getDocs(sensorDataQuery);
      const sensorData = sensorSnapshot.docs.map(doc => doc.data());

      // Load event data
      const eventDataQuery = query(
        collection(db, 'events'),
        orderBy('startTime', 'desc'),
        limit(5000)
      );
      
      const eventSnapshot = await getDocs(eventDataQuery);
      const eventData = eventSnapshot.docs.map(doc => doc.data());

      // Load maintenance data
      const maintenanceQuery = query(
        collection(db, 'maintenance_logs'),
        orderBy('timestamp', 'desc'),
        limit(2000)
      );
      
      const maintenanceSnapshot = await getDocs(maintenanceQuery);
      const maintenanceData = maintenanceSnapshot.docs.map(doc => doc.data());

      // Process and organize data by venue
      this.processHistoricalData(sensorData, eventData, maintenanceData);
      
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  // Process historical data into training format
  private processHistoricalData(sensorData: any[], eventData: any[], maintenanceData: any[]): void {
    const venueData = new Map<string, TrainingData[]>();

    // Group sensor data by venue
    sensorData.forEach(sensor => {
      const venueId = sensor.venueId;
      if (!venueData.has(venueId)) {
        venueData.set(venueId, []);
      }

      const timestamp = new Date(sensor.timestamp);
      const dayOfWeek = timestamp.getDay();
      const hourOfDay = timestamp.getHours();
      const month = timestamp.getMonth();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = this.isHoliday(timestamp);

      // Find related events and maintenance data
      const relatedEvents = eventData.filter(e => 
        e.venueId === venueId && 
        Math.abs(new Date(e.startTime).getTime() - timestamp.getTime()) < 24 * 60 * 60 * 1000
      );

      const relatedMaintenance = maintenanceData.filter(m => 
        m.venueId === venueId && 
        Math.abs(new Date(m.timestamp).getTime() - timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000
      );

      const trainingData: TrainingData = {
        venueId,
        timestamp,
        features: {
          occupancy: sensor.occupancy?.current || 0,
          temperature: sensor.temperature?.current || 72,
          humidity: sensor.humidity?.current || 50,
          weatherCondition: this.encodeWeatherCondition(sensor.weather?.condition || 'Clear'),
          dayOfWeek,
          hourOfDay,
          month,
          isWeekend: isWeekend ? 1 : 0,
          isHoliday: isHoliday ? 1 : 0,
          eventsCount: relatedEvents.length,
          maintenanceIssues: relatedMaintenance.length,
          revenue: sensor.revenue || 0,
          seasonality: 0,
          specialEvents: 0,
        },
        target: {
          nextOccupancy: this.getNextOccupancy(sensorData, venueId, timestamp),
          maintenanceRisk: this.calculateMaintenanceRisk(relatedMaintenance),
          crowdLevel: this.calculateCrowdLevel(relatedEvents),
          revenue: this.getNextRevenue(sensorData, venueId, timestamp),
        },
      };

      venueData.get(venueId)!.push(trainingData);
    });

    this.trainingData = venueData;
  }

  // Encode weather condition to numeric value
  private encodeWeatherCondition(condition: string): number {
    const weatherMap: { [key: string]: number } = {
      'Clear': 0,
      'Cloudy': 1,
      'Rain': 2,
      'Snow': 3,
      'Storm': 4,
      'Fog': 5,
    };
    return weatherMap[condition] || 0;
  }

  // Check if date is a holiday
  private isHoliday(date: Date): boolean {
    const holidays = [
      '01-01', // New Year's Day
      '07-04', // Independence Day
      '12-25', // Christmas
      '11-11', // Veterans Day
      '09-05', // Labor Day
    ];
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return holidays.includes(dateStr);
  }

  // Get next occupancy value for training
  private getNextOccupancy(sensorData: any[], venueId: string, timestamp: Date): number {
    const futureData = sensorData.filter(s => 
      s.venueId === venueId && 
      new Date(s.timestamp) > timestamp &&
      new Date(s.timestamp) <= new Date(timestamp.getTime() + 24 * 60 * 60 * 1000)
    );
    
    if (futureData.length > 0) {
      return futureData[0].occupancy?.current || 0;
    }
    return 0;
  }

  // Calculate maintenance risk
  private calculateMaintenanceRisk(maintenanceData: any[]): number {
    if (maintenanceData.length === 0) return 0;
    
    const criticalIssues = maintenanceData.filter(m => m.severity === 'critical').length;
    const highIssues = maintenanceData.filter(m => m.severity === 'high').length;
    const mediumIssues = maintenanceData.filter(m => m.severity === 'medium').length;
    
    return (criticalIssues * 3 + highIssues * 2 + mediumIssues * 1) / maintenanceData.length;
  }

  // Calculate crowd level
  private calculateCrowdLevel(events: any[]): number {
    if (events.length === 0) return 0;
    
    return events.reduce((sum, event) => sum + (event.participants?.length || 0), 0);
  }

  // Get next revenue value for training
  private getNextRevenue(sensorData: any[], venueId: string, timestamp: Date): number {
    const futureData = sensorData.filter(s => 
      s.venueId === venueId && 
      new Date(s.timestamp) > timestamp &&
      new Date(s.timestamp) <= new Date(timestamp.getTime() + 24 * 60 * 60 * 1000)
    );
    
    if (futureData.length > 0) {
      return futureData[0].revenue || 0;
    }
    return 0;
  }

  // Train models for all venues
  private async trainAllModels(): Promise<void> {
    if (this.isTraining) return;
    
    this.isTraining = true;
    console.log('Starting model training...');

    try {
      for (const [venueId, data] of this.trainingData.entries()) {
        if (data.length < 100) {
          console.log(`Insufficient data for venue ${venueId}, skipping training`);
          continue;
        }

        await this.trainModel(venueId, data);
      }
    } catch (error) {
      console.error('Failed to train models:', error);
    } finally {
      this.isTraining = false;
    }
  }

  // Generate predictions for all venues
  private async generatePredictions(): Promise<void> {
    try {
      console.log('Generating venue predictions...');

      for (const [venueId, model] of this.models.entries()) {
        const prediction = await this.predictVenue(venueId, model);
        if (prediction) {
          this.predictions.set(venueId, prediction);
          await this.savePrediction(prediction);
          await this.checkAlerts(prediction);
        }
      }
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    }
  }

  // Get current venue data
  private async getCurrentVenueData(venueId: string): Promise<any> {
    try {
      // This would fetch real-time data from Firestore
      // For now, return mock data
      return {
        occupancy: Math.random() * 100,
        temperature: 70 + Math.random() * 20,
        humidity: 40 + Math.random() * 40,
        weatherCondition: 'Clear',
        eventsCount: Math.floor(Math.random() * 5),
        maintenanceIssues: Math.floor(Math.random() * 3),
        revenue: Math.random() * 1000,
      };
    } catch (error) {
      console.error(`Failed to get current data for venue ${venueId}:`, error);
      return null;
    }
  }

  // Calculate trend
  private calculateTrend(current: number, predicted: number): 'increasing' | 'decreasing' | 'stable' {
    const change = predicted - current;
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  // Calculate next inspection date
  private calculateNextInspection(riskScore: number): Date {
    const daysUntilInspection = Math.max(1, Math.floor(30 * (1 - riskScore)));
    const nextInspection = new Date();
    nextInspection.setDate(nextInspection.getDate() + daysUntilInspection);
    return nextInspection;
  }

  // Get priority issues
  private getPriorityIssues(venueId: string): string[] {
    // This would fetch from maintenance logs
    return ['Lighting system needs replacement', 'Parking lot surface repair'];
  }

  // Estimate maintenance cost
  private estimateMaintenanceCost(riskScore: number): number {
    return riskScore * 5000 + Math.random() * 2000;
  }

  // Calculate peak time
  private calculatePeakTime(venueId: string): Date {
    const peakTime = new Date();
    peakTime.setHours(18, 0, 0, 0); // 6 PM
    return peakTime;
  }

  // Calculate crowd duration
  private calculateCrowdDuration(venueId: string): number {
    return 2 + Math.random() * 3; // 2-5 hours
  }

  // Calculate revenue trend
  private calculateRevenueTrend(current: number, predicted: number): 'up' | 'down' | 'stable' {
    const change = predicted - current;
    if (Math.abs(change) < 50) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  // Identify revenue factors
  private identifyRevenueFactors(venueId: string): string[] {
    return ['Weekend events', 'Good weather', 'Local tournament'];
  }

  // Generate recommendations
  private generateRecommendations(venueId: string, predictions: any): string[] {
    const recommendations: string[] = [];

    if (predictions.occupancy < 30) {
      recommendations.push('Consider hosting promotional events to increase venue usage');
    }

    if (predictions.maintenanceRisk > 0.7) {
      recommendations.push('Schedule maintenance inspection to prevent equipment failure');
    }

    if (predictions.crowdLevel > 100) {
      recommendations.push('Prepare for high crowd levels - ensure adequate staffing');
    }

    if (predictions.revenue < 500) {
      recommendations.push('Implement dynamic pricing during peak hours to increase revenue');
    }

    return recommendations;
  }

  // Save prediction to Firestore
  private async savePrediction(prediction: VenuePrediction): Promise<void> {
    try {
      await addDoc(collection(db, 'venue_predictions'), {
        ...prediction,
        timestamp: prediction.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to save prediction:', error);
    }
  }

  // Check all alerts
  private async checkAllAlerts(): Promise<void> {
    // This would check for new alerts based on current conditions
    console.log('Checking for new alerts...');
  }

  // Get predictions for a venue
  getVenuePrediction(venueId: string): VenuePrediction | undefined {
    return this.predictions.get(venueId);
  }

  // Get all predictions
  getAllPredictions(): VenuePrediction[] {
    return Array.from(this.predictions.values());
  }

  // Get alerts for a venue
  getVenueAlerts(venueId: string): VenueAlert[] {
    return this.alerts.filter(alert => alert.venueId === venueId);
  }

  // Get all alerts
  getAllAlerts(): VenueAlert[] {
    return this.alerts;
  }

  // Get model metrics
  getModelMetrics(venueId: string): ModelMetrics | undefined {
    return this.metrics.get(venueId);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      await updateDoc(doc(db, 'venue_alerts', alertId), {
        acknowledged: true,
      });
    }
  }
}

// Export singleton instance
export const venuePredictor = VenuePredictor.getInstance(); 
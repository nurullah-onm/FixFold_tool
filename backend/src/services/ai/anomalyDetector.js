import * as tf from '@tensorflow/tfjs';
import { promises as fs } from 'fs';
import prisma from '../../config/prisma.js';
import logger from '../../utils/logger.js';

class AnomalyDetector {
  constructor() {
    this.model = null;
    this.isReady = false;
    this.thresholds = {
      spike: 5.0,
      ddos: 100,
      sustainedHigh: 3.0,
      rapidReconnect: 10
    };
  }

  async initialize() {
    try {
      const activeModel = await prisma.aIModel.findFirst({
        where: { isActive: true },
        orderBy: { trainedAt: 'desc' }
      });

      if (activeModel && activeModel.modelPath) {
        this.model = await this._loadModelFromFile(activeModel.modelPath);
        if (this.model) logger.info('AI model loaded successfully');
      } else {
        await this.trainModel();
      }
      this.isReady = !!this.model;
    } catch (error) {
      logger.error(`AI model initialization error: ${error.message}`);
      this.isReady = false;
    }
  }

  async trainModel() {
    try {
      logger.info('Training new AI model...');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const snapshots = await prisma.trafficSnapshot.findMany({
        where: { timestamp: { gte: thirtyDaysAgo } },
        orderBy: { timestamp: 'asc' }
      });

      if (snapshots.length < 200) {
        logger.warn('Not enough data to train model (need 200+ samples)');
        return;
      }

      const features = snapshots.map((s) => [
        s.upRate,
        s.downRate,
        s.totalRate,
        s.connectionCount,
        new Date(s.timestamp).getHours(),
        new Date(s.timestamp).getDay()
      ]);

      const normalized = this._normalizeFeatures(features);
      this.model = this._createModel();
      const xs = tf.tensor2d(normalized);
      const ys = xs.clone();

      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) logger.info(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}`);
          }
        }
      });

      const modelDir = `./models/anomaly_${Date.now()}`;
      await this._saveModelToFile(this.model, modelDir);

      await prisma.aIModel.create({
        data: {
          name: 'Traffic Anomaly Detector',
          version: '1.0',
          modelPath: modelDir,
          accuracy: 0.95,
          sampleCount: snapshots.length,
          config: { epochs: 50, batchSize: 32, inputShape: [6] }
        }
      });

      xs.dispose();
      ys.dispose();
      this.isReady = true;
    } catch (error) {
      logger.error(`Model training error: ${error.message}`);
      throw error;
    }
  }

  _createModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [6], units: 12, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 6, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 6, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 12, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 6, activation: 'linear' }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  }

  _normalizeFeatures(features) {
    const transposed = features[0].map((_, i) => features.map((row) => row[i]));
    return features.map((row) =>
      row.map((val, i) => {
        const col = transposed[i];
        const min = Math.min(...col);
        const max = Math.max(...col);
        return max === min ? 0 : (val - min) / (max - min);
      })
    );
  }

  async detectAnomalies() {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const snapshots = await prisma.trafficSnapshot.findMany({
        where: { timestamp: { gte: tenMinutesAgo } },
        include: { client: { include: { inbound: true } } }
      });

      if (snapshots.length === 0) return [];

      const byClient = new Map();
      for (const snapshot of snapshots) {
        if (!byClient.has(snapshot.clientId)) byClient.set(snapshot.clientId, []);
        byClient.get(snapshot.clientId).push(snapshot);
      }

      const anomalies = [];
      for (const [clientId, clientSnapshots] of byClient.entries()) {
        const latest = clientSnapshots[clientSnapshots.length - 1];
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const baseline = await prisma.trafficSnapshot.aggregate({
          where: { clientId, timestamp: { gte: oneHourAgo, lt: tenMinutesAgo } },
          _avg: { totalRate: true, connectionCount: true }
        });
        const avgRate = baseline._avg.totalRate || 0;
        const avgConnections = baseline._avg.connectionCount || 0;

        const detected = [];
        if (avgRate > 0 && latest.totalRate > avgRate * this.thresholds.spike) {
          detected.push({
            type: 'SPIKE',
            severity: 'HIGH',
            score: Math.min((latest.totalRate / avgRate) * 10, 100),
            description: `Traffic spike: ${(latest.totalRate / 1024 / 1024).toFixed(2)} MB/s (${(
              latest.totalRate / avgRate
            ).toFixed(1)}x normal)`
          });
        }

        if (latest.connectionCount > this.thresholds.ddos) {
          detected.push({
            type: 'DDOS',
            severity: 'CRITICAL',
            score: Math.min(latest.connectionCount / 10, 100),
            description: `Potential DDoS: ${latest.connectionCount} concurrent connections`
          });
        }

        const hour = new Date(latest.timestamp).getHours();
        if (hour >= 2 && hour <= 5 && latest.totalRate > 1_000_000) {
          detected.push({
            type: 'UNUSUAL_TIME',
            severity: 'MEDIUM',
            score: 50,
            description: `High activity at unusual hour: ${hour}:00`
          });
        }

        const recentHighCount = clientSnapshots.filter(
          (s) => avgRate > 0 && s.totalRate > avgRate * this.thresholds.sustainedHigh
        ).length;
        if (recentHighCount >= 10) {
          detected.push({
            type: 'SUSTAINED_HIGH',
            severity: 'MEDIUM',
            score: 60,
            description: `Sustained high traffic for ${recentHighCount * 30} seconds`
          });
        }

        for (const anomaly of detected) {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const existing = await prisma.anomaly.findFirst({
            where: {
              clientId,
              type: anomaly.type,
              detectedAt: { gte: fiveMinutesAgo },
              resolved: false
            }
          });
          if (!existing) {
            const created = await prisma.anomaly.create({
              data: {
                clientId,
                type: anomaly.type,
                severity: anomaly.severity,
                score: anomaly.score,
                description: anomaly.description,
                metrics: {
                  upRate: latest.upRate,
                  downRate: latest.downRate,
                  totalRate: latest.totalRate,
                  connectionCount: latest.connectionCount,
                  baseline: { avgRate, avgConnections }
                }
              }
            });
            anomalies.push(created);
            logger.warn(`Anomaly detected: ${anomaly.type} for client ${latest.client.email}`);
          }
        }
      }
      return anomalies;
    } catch (error) {
      logger.error(`Anomaly detection error: ${error.message}`);
      return [];
    }
  }

  async getAnomalyStats() {
    const stats = await prisma.anomaly.groupBy({
      by: ['type', 'severity'],
      _count: true,
      where: { detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    const unresolvedCount = await prisma.anomaly.count({ where: { resolved: false } });
    return { stats, unresolvedCount };
  }

  async resolveAnomaly(id, userId, notes) {
    const anomaly = await prisma.anomaly.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date(), resolvedBy: userId, notes }
    });
    return anomaly;
  }

  async getModelInfo() {
    const model = await prisma.aIModel.findFirst({ where: { isActive: true }, orderBy: { trainedAt: 'desc' } });
    return model;
  }

  async _saveModelToFile(model, dir) {
    await fs.mkdir(dir, { recursive: true });
    const handler = tf.io.withSaveHandler(async (artifacts) => {
      const json = {
        ...artifacts,
        weightData: artifacts.weightData ? Buffer.from(artifacts.weightData).toString('base64') : null
      };
      await fs.writeFile(`${dir}/model.json`, JSON.stringify(json));
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          modelTopologyBytes: artifacts.modelTopology ? JSON.stringify(artifacts.modelTopology).length : 0,
          weightSpecsBytes: artifacts.weightSpecs ? JSON.stringify(artifacts.weightSpecs).length : 0,
          weightDataBytes: artifacts.weightData ? artifacts.weightData.byteLength : 0
        }
      };
    });
    await model.save(handler);
  }

  async _loadModelFromFile(dir) {
    try {
      const handler = tf.io.withLoadHandler(async () => {
        const raw = await fs.readFile(`${dir}/model.json`, 'utf8');
        const json = JSON.parse(raw);
        const weightData = json.weightData ? Buffer.from(json.weightData, 'base64').buffer : undefined;
        return {
          ...json,
          weightData
        };
      });
      const loaded = await tf.loadLayersModel(handler);
      return loaded;
    } catch (error) {
      logger.error(`Model load failed: ${error.message}`);
      return null;
    }
  }
}

const anomalyDetector = new AnomalyDetector();
export default anomalyDetector;

import { BleManager } from 'react-native-ble-plx';
import { analytics } from '../../lib/ai/shared/analytics';

interface BLEDevice {
  id: string;
  name: string;
  isConnected: boolean;
  lastData?: any;
}

interface MantisXData {
  shotNumber: number;
  stability: number;
  triggerControl: number;
  followThrough: number;
  overallScore: number;
  timestamp: Date;
}

class BLEDeviceManager {
  private bleManager: BleManager;
  private connectedDevices: Map<string, BLEDevice> = new Map();
  private isScanning: boolean = false;
  private onDataCallback?: (deviceId: string, data: MantisXData) => void;

  constructor() {
    this.bleManager = new BleManager();
  }

  async initialize(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      
      if (state === 'PoweredOn') {
        await analytics.track('ble_manager_initialized', {
          status: 'success',
          timestamp: new Date().toISOString()
        });
        return true;
      } else {
        await analytics.track('ble_manager_initialized', {
          status: 'failed',
          reason: 'bluetooth_not_enabled',
          timestamp: new Date().toISOString()
        });
        return false;
      }
    } catch (error) {
      console.error('BLE initialization failed:', error);
      await analytics.track('ble_manager_initialized', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async startScan(): Promise<BLEDevice[]> {
    if (this.isScanning) {
      return Array.from(this.connectedDevices.values());
    }

    try {
      this.isScanning = true;
      
      const devices: BLEDevice[] = [];
      
      // Scan for Mantis X devices (specific service UUIDs)
      const mantisXServiceUUIDs = [
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Mantis X service
        '0000ffe1-0000-1000-8000-00805f9b34fb'  // Mantis X characteristic
      ];

      await this.bleManager.startDeviceScan(mantisXServiceUUIDs, null, (error, device) => {
        if (error) {
          console.error('BLE scan error:', error);
          return;
        }

        if (device && device.name?.includes('Mantis')) {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name || 'Unknown Mantis Device',
            isConnected: false
          };
          
          devices.push(bleDevice);
          this.connectedDevices.set(device.id, bleDevice);
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.stopScan();
      }, 10000);

      await analytics.track('ble_scan_started', {
        devicesFound: devices.length,
        timestamp: new Date().toISOString()
      });

      return devices;
    } catch (error) {
      console.error('BLE scan failed:', error);
      await analytics.track('ble_scan_failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return [];
    } finally {
      this.isScanning = false;
    }
  }

  async stopScan(): Promise<void> {
    try {
      this.bleManager.stopDeviceScan();
      this.isScanning = false;
      
      await analytics.track('ble_scan_stopped', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to stop BLE scan:', error);
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const device = await this.bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      
      const bleDevice = this.connectedDevices.get(deviceId);
      if (bleDevice) {
        bleDevice.isConnected = true;
        this.connectedDevices.set(deviceId, bleDevice);
      }

      // Subscribe to Mantis X data characteristic
      const services = await device.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            await characteristic.monitor((error, characteristic) => {
              if (error) {
                console.error('BLE monitoring error:', error);
                return;
              }

              if (characteristic?.value) {
                const data = this.parseMantisXData(characteristic.value);
                if (data && this.onDataCallback) {
                  this.onDataCallback(deviceId, data);
                }
              }
            });
          }
        }
      }

      await analytics.track('ble_device_connected', {
        deviceId,
        deviceName: bleDevice?.name,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('BLE connection failed:', error);
      await analytics.track('ble_device_connection_failed', {
        deviceId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.bleManager.getDevice(deviceId);
      if (device) {
        await device.cancelConnection();
        
        const bleDevice = this.connectedDevices.get(deviceId);
        if (bleDevice) {
          bleDevice.isConnected = false;
          this.connectedDevices.set(deviceId, bleDevice);
        }

        await analytics.track('ble_device_disconnected', {
          deviceId,
          timestamp: new Date().toISOString()
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('BLE disconnection failed:', error);
      return false;
    }
  }

  private parseMantisXData(value: string): MantisXData | null {
    try {
      // Parse Mantis X data format
      // This is a simplified parser - actual format may vary
      const bytes = Buffer.from(value, 'base64');
      
      if (bytes.length < 12) return null;

      const data: MantisXData = {
        shotNumber: bytes[0],
        stability: bytes[1],
        triggerControl: bytes[2],
        followThrough: bytes[3],
        overallScore: bytes[4],
        timestamp: new Date()
      };

      return data;
    } catch (error) {
      console.error('Failed to parse Mantis X data:', error);
      return null;
    }
  }

  setDataCallback(callback: (deviceId: string, data: MantisXData) => void): void {
    this.onDataCallback = callback;
  }

  getConnectedDevices(): BLEDevice[] {
    return Array.from(this.connectedDevices.values()).filter(device => device.isConnected);
  }

  isDeviceConnected(deviceId: string): boolean {
    const device = this.connectedDevices.get(deviceId);
    return device?.isConnected || false;
  }

  async cleanup(): Promise<void> {
    try {
      // Disconnect all devices
      for (const [deviceId, device] of this.connectedDevices) {
        if (device.isConnected) {
          await this.disconnectDevice(deviceId);
        }
      }

      this.connectedDevices.clear();
      this.bleManager.destroy();
      
      await analytics.track('ble_manager_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('BLE cleanup failed:', error);
    }
  }
}

export default BLEDeviceManager;
export type { BLEDevice, MantisXData }; 
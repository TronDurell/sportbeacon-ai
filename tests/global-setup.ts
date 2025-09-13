/* SportBeaconAI - Global Test Setup
   Initialize Firebase emulators and test environment
*/

import { spawn, ChildProcess } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001
};

let emulatorProcess: ChildProcess | null = null;

export default async function globalSetup() {
  console.log('🚀 Starting Firebase emulators for testing...');

  try {
    // Start Firebase emulators
    emulatorProcess = spawn('firebase', [
      'emulators:start',
      '--only',
      'auth,firestore',
      '--project',
      'sportbeacon-test'
    ], {
      stdio: 'pipe',
      shell: true
    });

    // Wait for emulators to start
    await new Promise<void>((resolve, reject) => {
      let output = '';
      
      emulatorProcess?.stdout?.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
        
        // Check if emulators are ready
        if (output.includes('All emulators ready') || output.includes('Emulator UI ready')) {
          resolve();
        }
      });

      emulatorProcess?.stderr?.on('data', (data) => {
        const error = data.toString();
        console.error(error);
        
        // Some stderr output is normal, only reject on actual errors
        if (error.includes('Error:') && !error.includes('Warning:')) {
          reject(new Error(error));
        }
      });

      emulatorProcess?.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Emulator startup timeout'));
      }, 30000);
    });

    console.log('✅ Firebase emulators started successfully');
    
    // Wait a bit more for emulators to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('❌ Failed to start Firebase emulators:', error);
    throw error;
  }
}

// Cleanup function
export async function globalTeardown() {
  console.log('🛑 Stopping Firebase emulators...');
  
  if (emulatorProcess) {
    emulatorProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!emulatorProcess.killed) {
      emulatorProcess.kill('SIGKILL');
    }
  }
  
  console.log('✅ Firebase emulators stopped');
}

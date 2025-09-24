// Memory SDK compatibility façade for frontend usage
export interface MemorySDKCompat {
  remember?: (...args: any[]) => Promise<any>;
  recall?: (...args: any[]) => Promise<any>;
  learn?: (...args: any[]) => Promise<any>;
  feedback?: (...args: any[]) => Promise<any>;
  writeEvent?: (...args: any[]) => Promise<any>;
  purgeLowValue?: (...args: any[]) => Promise<any>;
}

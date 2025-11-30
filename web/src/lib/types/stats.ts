// Stats types matching the agent's output
// These mirror the systeminformation types used in the agent

export interface BatteryData {
  hasBattery: boolean;
  cycleCount: number;
  isCharging: boolean;
  designedCapacity: number;
  maxCapacity: number;
  currentCapacity: number;
  voltage: number;
  capacityUnit: string;
  percent: number;
  timeRemaining: number;
  acConnected: boolean;
  type: string;
  model: string;
  manufacturer: string;
  serial: string;
}

export interface CpuData {
  manufacturer: string;
  brand: string;
  vendor: string;
  family: string;
  model: string;
  stepping: string;
  revision: string;
  voltage: string;
  speed: number;
  speedMin: number;
  speedMax: number;
  governor: string;
  cores: number;
  physicalCores: number;
  performanceCores: number;
  efficiencyCores: number;
  processors: number;
  socket: string;
  flags: string;
  virtualization: boolean;
  cache: {
    l1d: number;
    l1i: number;
    l2: number;
    l3: number;
  };
}

export interface CpuCurrentSpeedData {
  min: number;
  max: number;
  avg: number;
  cores: number[];
}

export interface CpuTemperatureData {
  main: number;
  cores: number[];
  max: number;
  socket: number[];
  chipset: number;
}

export interface FsSizeData {
  fs: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
  rw: boolean;
}

export interface MemData {
  total: number;
  free: number;
  used: number;
  active: number;
  available: number;
  buffers: number;
  cached: number;
  slab: number;
  buffcache: number;
  swaptotal: number;
  swapused: number;
  swapfree: number;
  writeback: number;
  dirty: number;
}

export interface Stats {
  battery: BatteryData;
  cpu: CpuData;
  cpuCurrentSpeed: CpuCurrentSpeedData;
  cpuTemperature: CpuTemperatureData;
  fsSize: FsSizeData[];
  mem: MemData;
}

export interface StatsPayload {
  data: Stats;
}

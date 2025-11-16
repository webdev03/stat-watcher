import {
  battery,
  cpu,
  cpuCurrentSpeed,
  cpuTemperature,
  fsSize,
  mem,
  type Systeminformation,
} from "systeminformation";

export type Stats = {
  readonly battery: Systeminformation.BatteryData;
  readonly cpu: Systeminformation.CpuData;
  readonly cpuCurrentSpeed: Systeminformation.CpuCurrentSpeedData;
  readonly cpuTemperature: Systeminformation.CpuTemperatureData;
  readonly fsSize: Systeminformation.FsSizeData[];
  readonly mem: Systeminformation.MemData;
};

export async function getStats(): Promise<Stats> {
  return {
    battery: await battery(),
    cpu: await cpu(),
    cpuCurrentSpeed: await cpuCurrentSpeed(),
    cpuTemperature: await cpuTemperature(),
    fsSize: await fsSize(),
    mem: await mem(),
  };
}

<script lang="ts">
  import Activity from "@lucide/svelte/icons/activity";
  import Cpu from "@lucide/svelte/icons/cpu";
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Plus from "@lucide/svelte/icons/plus";
  import { Badge } from "$lib/components/ui/badge";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import type { Stats } from "$lib/types/stats";
  import { onMount } from "svelte";

  interface Machine {
    id: string;
    name: string;
    lastSeen: string | null;
    isOnline: boolean;
  }

  interface MachineWithStats extends Machine {
    stats: Stats | null;
  }

  let machines = $state<MachineWithStats[]>([]);
  let isLoading = $state(true);

  async function loadDashboard() {
    try {
      const response = await fetch("/api/machines");
      if (!response.ok) return;

      const data = await response.json();
      const machineList = data.machines as Machine[];

      // Fetch stats for online machines
      const machinesWithStats = await Promise.all(
        machineList.map(async (m) => {
          if (!m.isOnline) {
            return { ...m, stats: null };
          }
          try {
            const statsRes = await fetch(`/api/machines/${m.id}`);
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              return { ...m, stats: statsData.stats };
            }
          } catch {
            // Ignore errors
          }
          return { ...m, stats: null };
        }),
      );

      machines = machinesWithStats;
    } finally {
      isLoading = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function getMemoryPercent(stats: Stats | null): number {
    if (!stats?.mem) return 0;
    return (stats.mem.used / stats.mem.total) * 100;
  }

  function getCpuTemp(stats: Stats | null): number | null {
    if (!stats?.cpuTemperature?.main) return null;
    return stats.cpuTemperature.main;
  }

  function getDiskPercent(stats: Stats | null): number {
    if (!stats?.fsSize?.length) return 0;
    const total = stats.fsSize.reduce((a, b) => a + b.size, 0);
    const used = stats.fsSize.reduce((a, b) => a + b.used, 0);
    return (used / total) * 100;
  }

  const onlineCount = $derived(machines.filter((m) => m.isOnline).length);

  onMount(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">Overview of your monitored systems</p>
    </div>
    <Button href="/app/machines/new">
      <Plus class="size-4" />
      Add Machine
    </Button>
  </div>

  <!-- Summary Cards -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Card>
      <Card.Header class="pb-2">
        <Card.Description>Total Machines</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold flex items-center gap-2">
          <Monitor class="size-5 text-muted-foreground" />
          {isLoading ? "-" : machines.length}
        </div>
      </Card.Content>
    </Card.Card>

    <Card.Card>
      <Card.Header class="pb-2">
        <Card.Description>Online</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold flex items-center gap-2 text-green-500">
          <Activity class="size-5" />
          {isLoading ? "-" : onlineCount}
        </div>
      </Card.Content>
    </Card.Card>

    <Card.Card>
      <Card.Header class="pb-2">
        <Card.Description>Offline</Card.Description>
      </Card.Header>
      <Card.Content>
        <div
          class="text-2xl font-bold flex items-center gap-2 text-muted-foreground"
        >
          <Activity class="size-5" />
          {isLoading ? "-" : machines.length - onlineCount}
        </div>
      </Card.Content>
    </Card.Card>

    <Card.Card>
      <Card.Header class="pb-2">
        <Card.Description>Avg CPU Temp</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold flex items-center gap-2">
          <Cpu class="size-5 text-muted-foreground" />
          {#if isLoading}
            -
          {:else}
            {@const temps = machines
              .map((m) => getCpuTemp(m.stats))
              .filter((t) => t !== null)}
            {temps.length > 0
              ? `${Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)}°C`
              : "N/A"}
          {/if}
        </div>
      </Card.Content>
    </Card.Card>
  </div>

  <!-- Machine Stats Grid -->
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Machine Status</h2>

    {#if isLoading}
      <div class="grid gap-4 md:grid-cols-2">
        {#each Array(2) as _}
          <Card.Card>
            <Card.Header>
              <Skeleton class="h-5 w-40" />
            </Card.Header>
            <Card.Content class="space-y-4">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
            </Card.Content>
          </Card.Card>
        {/each}
      </div>
    {:else if machines.length === 0}
      <Card.Card>
        <Card.Content class="py-12 text-center">
          <Monitor class="text-muted-foreground mx-auto size-12 mb-4" />
          <h3 class="text-lg font-semibold mb-2">No machines yet</h3>
          <p class="text-muted-foreground mb-4">
            Add your first machine to start monitoring
          </p>
          <Button href="/app/machines/new">
            <Plus class="size-4" />
            Add Machine
          </Button>
        </Card.Content>
      </Card.Card>
    {:else}
      <div class="grid gap-4 md:grid-cols-2">
        {#each machines as machine (machine.id)}
          <a href="/app/machines/{machine.id}">
            <Card.Card variant="interactive">
              <Card.Header>
                <div class="flex items-center justify-between">
                  <Card.Title class="flex items-center gap-2">
                    <Monitor class="size-5" />
                    {machine.name}
                  </Card.Title>
                  <Badge variant={machine.isOnline ? "success" : "secondary"}>
                    {machine.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Content>
                {#if machine.stats}
                  <div class="space-y-4">
                    <!-- CPU -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-1">
                          <Cpu class="size-3" /> CPU
                        </span>
                        <span class="text-muted-foreground">
                          {machine.stats.cpuCurrentSpeed?.avg?.toFixed(1) ??
                            "?"} GHz
                          {#if getCpuTemp(machine.stats)}
                            • {getCpuTemp(machine.stats)}°C
                          {/if}
                        </span>
                      </div>
                    </div>

                    <!-- Memory -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-1">
                          <MemoryStick class="size-3" /> Memory
                        </span>
                        <span class="text-muted-foreground">
                          {formatBytes(machine.stats.mem?.used ?? 0)} / {formatBytes(
                            machine.stats.mem?.total ?? 0,
                          )}
                        </span>
                      </div>
                      <Progress
                        value={getMemoryPercent(machine.stats)}
                        variant={getMemoryPercent(machine.stats) > 90
                          ? "danger"
                          : getMemoryPercent(machine.stats) > 70
                            ? "warning"
                            : "default"}
                      />
                    </div>

                    <!-- Disk -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-1">
                          <HardDrive class="size-3" /> Disk
                        </span>
                        <span class="text-muted-foreground">
                          {getDiskPercent(machine.stats).toFixed(0)}% used
                        </span>
                      </div>
                      <Progress
                        value={getDiskPercent(machine.stats)}
                        variant={getDiskPercent(machine.stats) > 90
                          ? "danger"
                          : getDiskPercent(machine.stats) > 70
                            ? "warning"
                            : "default"}
                      />
                    </div>
                  </div>
                {:else}
                  <p class="text-muted-foreground text-sm">
                    No stats available - machine is offline
                  </p>
                {/if}
              </Card.Content>
            </Card.Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

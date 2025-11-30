<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Progress } from "$lib/components/ui/progress";
  import Input from "$lib/components/ui/input/input.svelte";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Cpu from "@lucide/svelte/icons/cpu";
  import MemoryStick from "@lucide/svelte/icons/memory-stick";
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import Battery from "@lucide/svelte/icons/battery";
  import BatteryCharging from "@lucide/svelte/icons/battery-charging";
  import Thermometer from "@lucide/svelte/icons/thermometer";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";
  import Zap from "@lucide/svelte/icons/zap";
  import type { Stats } from "$lib/types/stats";

  interface Machine {
    id: string;
    name: string;
    lastSeen: string | null;
    createdAt: string;
    isOnline: boolean;
  }

  const machineId = $derived($page.params.id);

  let machine = $state<Machine | null>(null);
  let stats = $state<Stats | null>(null);
  let lastUpdated = $state<Date | null>(null);
  let isLoading = $state(true);
  let error = $state("");
  let eventSource: EventSource | null = null;

  // Edit mode
  let isEditing = $state(false);
  let editName = $state("");
  let isSaving = $state(false);

  // Delete confirmation
  let showDeleteConfirm = $state(false);
  let isDeleting = $state(false);

  // Widget visibility settings
  let visibleWidgets = $state({
    cpu: true,
    memory: true,
    disk: true,
    battery: true,
    temperature: true,
    cpuInfo: true,
  });

  async function loadMachine() {
    isLoading = true;
    error = "";

    try {
      const response = await fetch(`/api/machines/${machineId}`);
      if (!response.ok) {
        if (response.status === 404) {
          error = "Machine not found";
        } else {
          throw new Error("Failed to load machine");
        }
        return;
      }

      const data = await response.json();
      machine = data.machine;
      stats = data.stats;
      lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
      editName = machine?.name ?? "";
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  }

  function connectStream() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(`/api/machines/${machineId}/stream`);

    eventSource.addEventListener("stats", (event) => {
      try {
        stats = JSON.parse(event.data);
        lastUpdated = new Date();
        if (machine) {
          machine.isOnline = true;
        }
      } catch {
        // Ignore parse errors
      }
    });

    eventSource.addEventListener("connected", () => {
      console.log("SSE connected");
    });

    eventSource.onerror = () => {
      // Reconnect after a delay
      setTimeout(() => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          connectStream();
        }
      }, 5000);
    };
  }

  async function saveName() {
    if (!machine || !editName.trim()) return;
    
    isSaving = true;
    try {
      const response = await fetch(`/api/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        machine.name = data.machine.name;
        isEditing = false;
      }
    } finally {
      isSaving = false;
    }
  }

  async function deleteMachine() {
    isDeleting = true;
    try {
      const response = await fetch(`/api/machines/${machineId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        goto("/app/machines");
      }
    } finally {
      isDeleting = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function getMemoryPercent(): number {
    if (!stats?.mem) return 0;
    return (stats.mem.used / stats.mem.total) * 100;
  }

  function getDiskPercent(): number {
    if (!stats?.fsSize?.length) return 0;
    const total = stats.fsSize.reduce((a, b) => a + b.size, 0);
    const used = stats.fsSize.reduce((a, b) => a + b.used, 0);
    return (used / total) * 100;
  }

  function getTempVariant(temp: number): "default" | "warning" | "danger" {
    if (temp >= 80) return "danger";
    if (temp >= 60) return "warning";
    return "default";
  }

  onMount(() => {
    loadMachine();
    connectStream();

    // Load widget preferences from localStorage
    const saved = localStorage.getItem(`widgets-${machineId}`);
    if (saved) {
      try {
        visibleWidgets = { ...visibleWidgets, ...JSON.parse(saved) };
      } catch {
        // Ignore
      }
    }
  });

  onDestroy(() => {
    eventSource?.close();
  });

  // Save widget preferences
  $effect(() => {
    if (machineId) {
      localStorage.setItem(`widgets-${machineId}`, JSON.stringify(visibleWidgets));
    }
  });
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="icon" href="/app/machines">
      <ArrowLeft class="size-4" />
    </Button>
    
    {#if isLoading}
      <Skeleton class="h-8 w-48" />
    {:else if machine}
      <div class="flex-1 flex items-center gap-3">
        {#if isEditing}
          <Input
            bind:value={editName}
            class="max-w-xs"
            onkeydown={(e) => e.key === "Enter" && saveName()}
          />
          <Button variant="ghost" size="icon" onclick={saveName} disabled={isSaving}>
            <Check class="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onclick={() => { isEditing = false; editName = machine?.name ?? ""; }}>
            <X class="size-4" />
          </Button>
        {:else}
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Monitor class="size-6" />
            {machine.name}
          </h1>
          <Button variant="ghost" size="icon" onclick={() => isEditing = true}>
            <Pencil class="size-4" />
          </Button>
        {/if}
        <Badge variant={machine.isOnline ? "success" : "secondary"}>
          {#if machine.isOnline}
            <span class="mr-1 size-2 rounded-full bg-green-500 animate-pulse"></span>
          {/if}
          {machine.isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
      
      {#if showDeleteConfirm}
        <div class="flex items-center gap-2">
          <span class="text-sm text-destructive">Delete this machine?</span>
          <Button variant="destructive" size="sm" onclick={deleteMachine} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </Button>
          <Button variant="outline" size="sm" onclick={() => showDeleteConfirm = false}>
            Cancel
          </Button>
        </div>
      {:else}
        <Button variant="ghost" size="icon" onclick={() => showDeleteConfirm = true}>
          <Trash2 class="size-4 text-destructive" />
        </Button>
      {/if}
    {/if}
  </div>

  {#if error}
    <Card.Card>
      <Card.Content class="py-12 text-center">
        <p class="text-destructive mb-4">{error}</p>
        <Button href="/app/machines">Back to Machines</Button>
      </Card.Content>
    </Card.Card>
  {:else if isLoading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <Card.Card>
          <Card.Header>
            <Skeleton class="h-5 w-24" />
          </Card.Header>
          <Card.Content>
            <Skeleton class="h-16 w-full" />
          </Card.Content>
        </Card.Card>
      {/each}
    </div>
  {:else if !stats}
    <Card.Card>
      <Card.Content class="py-12 text-center">
        <Monitor class="text-muted-foreground mx-auto size-12 mb-4" />
        <h3 class="text-lg font-semibold mb-2">Waiting for data...</h3>
        <p class="text-muted-foreground">
          Make sure the agent is running and configured with the correct token
        </p>
      </Card.Content>
    </Card.Card>
  {:else}
    <!-- Widget Toggle -->
    <Card.Card>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm">Customize Dashboard</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-wrap gap-2">
          {#each Object.entries(visibleWidgets) as [key, visible]}
            <button
              class="px-3 py-1 rounded-full text-sm border transition-colors {visible ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}"
              onclick={() => visibleWidgets[key as keyof typeof visibleWidgets] = !visible}
            >
              {key.toUpperCase()}
            </button>
          {/each}
        </div>
      </Card.Content>
    </Card.Card>

    <!-- Stats Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <!-- CPU Speed -->
      {#if visibleWidgets.cpu}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              <Cpu class="size-4" />
              CPU Speed
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">
              {stats.cpuCurrentSpeed?.avg?.toFixed(2) ?? "?"} <span class="text-lg font-normal text-muted-foreground">GHz</span>
            </div>
            {#if stats.cpuCurrentSpeed?.cores?.length}
              <div class="mt-3 grid grid-cols-4 gap-2">
                {#each stats.cpuCurrentSpeed.cores as coreSpeed, i}
                  <div class="text-center">
                    <div class="text-xs text-muted-foreground">Core {i}</div>
                    <div class="text-sm font-medium">{coreSpeed.toFixed(1)}</div>
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Card>
      {/if}

      <!-- Memory -->
      {#if visibleWidgets.memory}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              <MemoryStick class="size-4" />
              Memory
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">
              {getMemoryPercent().toFixed(0)}<span class="text-lg font-normal text-muted-foreground">%</span>
            </div>
            <Progress 
              value={getMemoryPercent()} 
              class="mt-2"
              variant={getMemoryPercent() > 90 ? "danger" : getMemoryPercent() > 70 ? "warning" : "default"}
            />
            <div class="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>{formatBytes(stats.mem?.used ?? 0)} used</span>
              <span>{formatBytes(stats.mem?.total ?? 0)} total</span>
            </div>
            {#if stats.mem?.swaptotal > 0}
              <div class="mt-2 pt-2 border-t">
                <div class="text-xs text-muted-foreground">Swap</div>
                <Progress 
                  value={(stats.mem.swapused / stats.mem.swaptotal) * 100} 
                  class="mt-1 h-1"
                />
                <div class="text-xs text-muted-foreground mt-1">
                  {formatBytes(stats.mem.swapused)} / {formatBytes(stats.mem.swaptotal)}
                </div>
              </div>
            {/if}
          </Card.Content>
        </Card.Card>
      {/if}

      <!-- Disk -->
      {#if visibleWidgets.disk}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              <HardDrive class="size-4" />
              Disk Usage
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">
              {getDiskPercent().toFixed(0)}<span class="text-lg font-normal text-muted-foreground">%</span>
            </div>
            <Progress 
              value={getDiskPercent()} 
              class="mt-2"
              variant={getDiskPercent() > 90 ? "danger" : getDiskPercent() > 70 ? "warning" : "default"}
            />
            {#if stats.fsSize?.length}
              <div class="mt-3 space-y-2 max-h-32 overflow-y-auto">
                {#each stats.fsSize as fs}
                  <div class="text-sm">
                    <div class="flex justify-between text-muted-foreground">
                      <span class="truncate max-w-[120px]" title={fs.mount}>{fs.mount}</span>
                      <span>{fs.use.toFixed(0)}%</span>
                    </div>
                    <Progress value={fs.use} class="h-1 mt-1" />
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Card>
      {/if}

      <!-- Battery -->
      {#if visibleWidgets.battery && stats.battery?.hasBattery}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              {#if stats.battery.isCharging}
                <BatteryCharging class="size-4" />
              {:else}
                <Battery class="size-4" />
              {/if}
              Battery
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">
              {stats.battery.percent}<span class="text-lg font-normal text-muted-foreground">%</span>
            </div>
            <Progress 
              value={stats.battery.percent} 
              class="mt-2"
              variant={stats.battery.percent < 20 ? "danger" : stats.battery.percent < 40 ? "warning" : "success"}
            />
            <div class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              {#if stats.battery.isCharging}
                <Zap class="size-3 text-yellow-500" />
                Charging
              {:else if stats.battery.timeRemaining > 0}
                {Math.floor(stats.battery.timeRemaining / 60)}h {stats.battery.timeRemaining % 60}m remaining
              {:else}
                {stats.battery.acConnected ? "Plugged in" : "On battery"}
              {/if}
            </div>
          </Card.Content>
        </Card.Card>
      {/if}

      <!-- Temperature -->
      {#if visibleWidgets.temperature && stats.cpuTemperature?.main}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              <Thermometer class="size-4" />
              CPU Temperature
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold" class:text-yellow-500={stats.cpuTemperature.main >= 60} class:text-red-500={stats.cpuTemperature.main >= 80}>
              {stats.cpuTemperature.main}<span class="text-lg font-normal text-muted-foreground">°C</span>
            </div>
            <Progress 
              value={stats.cpuTemperature.main} 
              max={100}
              class="mt-2"
              variant={getTempVariant(stats.cpuTemperature.main)}
            />
            {#if stats.cpuTemperature.cores?.length}
              <div class="mt-3 grid grid-cols-4 gap-2">
                {#each stats.cpuTemperature.cores as coreTemp, i}
                  {#if coreTemp > 0}
                    <div class="text-center">
                      <div class="text-xs text-muted-foreground">Core {i}</div>
                      <div class="text-sm font-medium" class:text-yellow-500={coreTemp >= 60} class:text-red-500={coreTemp >= 80}>
                        {coreTemp}°
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Card>
      {/if}

      <!-- CPU Info -->
      {#if visibleWidgets.cpuInfo}
        <Card.Card>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-sm">
              <Cpu class="size-4" />
              CPU Info
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-muted-foreground">Model:</span>
                <span class="ml-2 font-medium">{stats.cpu?.brand ?? "Unknown"}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Cores:</span>
                <span class="ml-2 font-medium">{stats.cpu?.cores ?? "?"} ({stats.cpu?.physicalCores ?? "?"} physical)</span>
              </div>
              <div>
                <span class="text-muted-foreground">Speed:</span>
                <span class="ml-2 font-medium">{stats.cpu?.speed ?? "?"} GHz (max {stats.cpu?.speedMax ?? "?"})</span>
              </div>
              {#if stats.cpu?.cache?.l3}
                <div>
                  <span class="text-muted-foreground">L3 Cache:</span>
                  <span class="ml-2 font-medium">{formatBytes(stats.cpu.cache.l3)}</span>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Card>
      {/if}
    </div>

    <!-- Last Updated -->
    {#if lastUpdated}
      <p class="text-muted-foreground text-sm text-center">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </p>
    {/if}
  {/if}
</div>

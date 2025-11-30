<script lang="ts">
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import Plus from "@lucide/svelte/icons/plus";
  import Monitor from "@lucide/svelte/icons/monitor";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";

  interface Machine {
    id: string;
    name: string;
    lastSeen: string | null;
    createdAt: string;
    isOnline: boolean;
  }

  let machines = $state<Machine[]>([]);
  let isLoading = $state(true);
  let error = $state("");

  async function loadMachines() {
    isLoading = true;
    error = "";
    
    try {
      const response = await fetch("/api/machines");
      if (!response.ok) {
        throw new Error("Failed to load machines");
      }
      const data = await response.json();
      machines = data.machines;
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  }

  function formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  onMount(() => {
    loadMachines();
    // Refresh every 10 seconds
    const interval = setInterval(loadMachines, 10000);
    return () => clearInterval(interval);
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Machines</h1>
      <p class="text-muted-foreground">Manage your monitored machines</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="icon" onclick={loadMachines} disabled={isLoading}>
        <RefreshCw class="size-4 {isLoading ? 'animate-spin' : ''}" />
      </Button>
      <Button href="/app/machines/new">
        <Plus class="size-4" />
        Add Machine
      </Button>
    </div>
  </div>

  {#if error}
    <Card.Card>
      <Card.Content class="py-6">
        <p class="text-destructive text-center">{error}</p>
        <Button variant="outline" onclick={loadMachines} class="mx-auto mt-4 block">
          Try Again
        </Button>
      </Card.Content>
    </Card.Card>
  {:else if isLoading && machines.length === 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _}
        <Card.Card>
          <Card.Header>
            <Skeleton class="h-5 w-32" />
            <Skeleton class="h-4 w-24" />
          </Card.Header>
          <Card.Content>
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
          Add your first machine to start monitoring system stats
        </p>
        <Button href="/app/machines/new">
          <Plus class="size-4" />
          Add Machine
        </Button>
      </Card.Content>
    </Card.Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  {#if machine.isOnline}
                    <span class="mr-1 size-2 rounded-full bg-green-500 animate-pulse"></span>
                  {/if}
                  {machine.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <Card.Description>
                Last seen: {formatLastSeen(machine.lastSeen)}
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p class="text-muted-foreground text-sm">
                Added {new Date(machine.createdAt).toLocaleDateString()}
              </p>
            </Card.Content>
          </Card.Card>
        </a>
      {/each}
    </div>
  {/if}
</div>

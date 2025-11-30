<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import CheckCircle from "@lucide/svelte/icons/check-circle";
  import Copy from "@lucide/svelte/icons/copy";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import Input from "$lib/components/ui/input/input.svelte";

  let name = $state("");
  let isCreating = $state(false);
  let error = $state("");
  let createdMachine = $state<{
    id: string;
    name: string;
    token: string;
  } | null>(null);
  let copied = $state(false);

  async function createMachine() {
    if (!name.trim()) {
      error = "Please enter a machine name";
      return;
    }

    isCreating = true;
    error = "";

    try {
      const response = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create machine");
      }

      const data = await response.json();
      createdMachine = {
        id: data.machine.id,
        name: data.machine.name,
        token: data.token,
      };
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isCreating = false;
    }
  }

  async function copyToken() {
    if (!createdMachine) return;
    await navigator.clipboard.writeText(createdMachine.token);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="mx-auto max-w-2xl">
  <Button variant="ghost" href="/app/machines" class="mb-4">
    <ArrowLeft class="size-4" />
    Back to Machines
  </Button>

  {#if !createdMachine}
    <Card.Card>
      <Card.Header>
        <Card.Title>Add New Machine</Card.Title>
        <Card.Description>
          Register a new machine to start monitoring its system stats
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            createMachine();
          }}
          class="space-y-4"
        >
          <div class="space-y-2">
            <label for="machine-name" class="text-sm font-medium"
              >Machine Name</label
            >
            <Input
              id="machine-name"
              bind:value={name}
              placeholder="e.g., My Desktop, Work Laptop, Home Server"
              disabled={isCreating}
            />
            {#if error}
              <p class="text-destructive text-sm">{error}</p>
            {/if}
          </div>
          <Button type="submit" disabled={isCreating} class="w-full">
            {#if isCreating}
              <Loader2 class="size-4 animate-spin" />
              Creating...
            {:else}
              Create Machine
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Card>
  {:else}
    <Card.Card>
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-green-500">
          <CheckCircle class="size-5" />
          Machine Created!
        </Card.Title>
        <Card.Description>
          Your machine "{createdMachine.name}" has been registered
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-6">
        <div class="space-y-2">
          <span class="text-sm font-medium">Your Agent Token</span>
          <div class="flex gap-2">
            <code
              class="bg-muted flex-1 rounded-md px-3 py-2 text-sm font-mono break-all"
            >
              {createdMachine.token}
            </code>
            <Button variant="outline" size="icon" onclick={copyToken}>
              {#if copied}
                <CheckCircle class="size-4 text-green-500" />
              {:else}
                <Copy class="size-4" />
              {/if}
            </Button>
          </div>
          <p class="text-muted-foreground text-xs">
            ⚠️ Save this token now! You won't be able to see it again.
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium">Setup Instructions</h4>
          <div class="bg-muted rounded-lg p-4 space-y-3">
            <div>
              <p class="text-sm font-medium">1. Install the agent</p>
              <code class="bg-background block rounded px-2 py-1 text-xs mt-1">
                bun install -g stat-watcher-agent
              </code>
            </div>
            <div>
              <p class="text-sm font-medium">2. Configure with your token</p>
              <code
                class="bg-background block rounded px-2 py-1 text-xs mt-1 break-all"
              >
                stat-watcher-agent configure --token {createdMachine.token}
              </code>
            </div>
            <div>
              <p class="text-sm font-medium">3. Start the agent</p>
              <code class="bg-background block rounded px-2 py-1 text-xs mt-1">
                stat-watcher-agent start
              </code>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            onclick={() => goto(`/app/machines/${createdMachine?.id}`)}
            class="flex-1"
          >
            View Machine Dashboard
          </Button>
          <Button variant="outline" onclick={() => goto("/app/machines")}>
            Back to Machines
          </Button>
        </div>
      </Card.Content>
    </Card.Card>
  {/if}
</div>

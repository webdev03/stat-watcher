<script lang="ts">
  import { Github } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import DiscordLogo from "$lib/DiscordLogo.svelte";

  async function signIn() {
    if ((await authClient.getSession()).data) {
      await goto("/app");
    } else {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/app",
      });
    }
  }
</script>

<svelte:head>
  <title>stat-watcher</title>
</svelte:head>

<div
  class="cool-gradient flex gap-2 justify-center items-center w-screen h-screen flex-col"
>
  <h1 class="text-balance text-4xl font-extrabold tracking-tight">
    stat-watcher
  </h1>
  <div class="flex gap-2">
    <Button onclick={signIn} class="cursor-pointer"
      ><DiscordLogo /> Continue with Discord</Button
    >
    <a
      href="https://github.com/webdev03/stat-watcher/"
      target="_blank"
      class={buttonVariants({ variant: "secondary" })}
      ><Github /> Star on GitHub</a
    >
  </div>
</div>

<style>
  .cool-gradient {
    background:
      radial-gradient(
        circle at top,
        rgba(120, 119, 198, 0.25),
        transparent 60%
      ),
      radial-gradient(
        circle at 30% 60%,
        rgba(56, 189, 248, 0.2),
        transparent 55%
      );
  }
</style>

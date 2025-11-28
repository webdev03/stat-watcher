<script lang="ts">
  import AppSidebar from "$lib/components/ui/AppSidebar.svelte";
  import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
  } from "$lib/components/ui/sidebar";
</script>

<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header class="flex h-12 items-center justify-between px-4">
      <SidebarTrigger />
    </header>
    <div class="m-4"><slot /></div>
  </SidebarInset>
</SidebarProvider>

<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import HouseIcon from "@lucide/svelte/icons/house";
  import MonitorCogIcon from "@lucide/svelte/icons/monitor-cog";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import { authClient } from "$lib/auth-client";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";

  const session = authClient.useSession();

  const items = [
    {
      title: "Home",
      url: "/app",
      icon: HouseIcon,
    },
    {
      title: "Machines",
      url: "/app/machines",
      icon: MonitorCogIcon,
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: SettingsIcon,
    },
  ];
</script>

<Sidebar.Root>
  <Sidebar.Header>
    <span class="font-semibold">stat-watcher</span>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Menu>
      {#each items as item (item.title)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href={item.url} {...props}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton
                {...props}
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {$session.data?.user.name}
                <ChevronUp class="ms-auto" />
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="top"
            class="w-(--bits-dropdown-menu-anchor-width)"
          >
            <DropdownMenu.Item>
              <span>Sign out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>

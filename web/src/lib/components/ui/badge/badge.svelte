<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";

  export const badgeVariants = tv({
    base: "focus:ring-ring inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent shadow",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive: "bg-destructive text-destructive-foreground border-transparent shadow",
        outline: "text-foreground",
        success: "bg-green-500/10 text-green-500 border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type BadgeProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: VariantProps<typeof badgeVariants>["variant"];
  };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    ref = $bindable(null),
    children,
    ...restProps
  }: BadgeProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="badge"
  class={cn(badgeVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>

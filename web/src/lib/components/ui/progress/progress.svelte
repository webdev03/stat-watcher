<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";

  export const progressVariants = tv({
    base: "bg-primary h-full w-full flex-1 transition-all",
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type ProgressProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    value?: number;
    max?: number;
    variant?: VariantProps<typeof progressVariants>["variant"];
    showLabel?: boolean;
  };
</script>

<script lang="ts">
  let {
    class: className,
    value = 0,
    max = 100,
    variant = "default",
    showLabel = false,
    ref = $bindable(null),
    ...restProps
  }: ProgressProps = $props();

  const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div
  bind:this={ref}
  data-slot="progress"
  class={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
  role="progressbar"
  aria-valuenow={value}
  aria-valuemin={0}
  aria-valuemax={max}
  {...restProps}
>
  <div
    class={cn(progressVariants({ variant }), "rounded-full")}
    style="width: {percentage}%"
  ></div>
  {#if showLabel}
    <span class="text-muted-foreground absolute right-0 -top-5 text-xs">
      {percentage.toFixed(0)}%
    </span>
  {/if}
</div>

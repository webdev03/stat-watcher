<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";

  export const cardVariants = tv({
    base: "bg-card text-card-foreground rounded-xl border shadow-sm",
    variants: {
      variant: {
        default: "",
        interactive: "hover:bg-accent/50 transition-colors cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type CardProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: VariantProps<typeof cardVariants>["variant"];
  };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    ref = $bindable(null),
    children,
    ...restProps
  }: CardProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(cardVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>

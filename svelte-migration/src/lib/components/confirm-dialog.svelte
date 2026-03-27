<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel = "Confirm",
    variant = "default",
    onConfirm,
  }: {
    open?: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  } = $props();

  let confirming = $state(false);

  async function handleConfirm() {
    confirming = true;
    try {
      await onConfirm();
      open = false;
    } finally {
      confirming = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button
        type="button"
        variant={variant === "destructive" ? "destructive" : "default"}
        disabled={confirming}
        onclick={() => void handleConfirm()}
      >
        {confirming ? "Working..." : confirmLabel}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

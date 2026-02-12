"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useOrganizations,
  useActiveOrganization,
  useSetActiveOrganization,
} from "@/hooks/use-organization";

export function OrgSwitcher({ onCreateOrg }: { onCreateOrg?: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: orgs } = useOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const setActive = useSetActiveOrganization();

  const handleSelect = (orgSlug: string) => {
    setOpen(false);
    setActive.mutate(
      { organizationSlug: orgSlug },
      { onSuccess: () => router.push(`/org/${orgSlug}`) },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-mono text-sm"
          />
        }
      >
        <span className="truncate">{activeOrg?.name ?? "Select team"}</span>
        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList>
            <CommandEmpty>No teams found.</CommandEmpty>
            <CommandGroup>
              {orgs?.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.slug}
                  onSelect={() => handleSelect(org.slug)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      activeOrg?.id === org.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate font-mono text-sm">{org.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateOrg && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateOrg();
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Create team
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

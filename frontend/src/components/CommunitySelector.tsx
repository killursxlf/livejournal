"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface Community {
  id: string;
  name: string;
  avatar: string;
  userCount: number;
}

interface CommunitySelectorProps {
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
  onShare: () => void;
}

export function CommunitySelector({ selectedCommunities, setSelectedCommunities, onShare }: CommunitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await fetch(`${backendURL}/api/user/communities`, {
          credentials: "include",
        });
        if (!res.ok) {
          console.error("Ошибка при загрузке сообществ");
          return;
        }
        const data = await res.json();
        setCommunities(data.communities);
      } catch (error) {
        console.error("Ошибка при запросе:", error);
      }
    }
    fetchCommunities();
  }, []);

  const toggleCommunity = (communityId: string) => {
    if (selectedCommunities.includes(communityId)) {
      setSelectedCommunities(selectedCommunities.filter((id) => id !== communityId));
    } else {
      setSelectedCommunities([...selectedCommunities, communityId]);
    }
  };

  const formatMembers = (count: number) => {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k members` : `${count} members`;
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      return avatarPath;
    }
    return `${backendURL}/${avatarPath}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Share to Communities</h2>
        {selectedCommunities.length > 0 && (
          <span className="text-xs text-muted-foreground">{selectedCommunities.length} selected</span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <span className="truncate">
              {selectedCommunities.length > 0
                ? `${selectedCommunities.length} communities selected`
                : "Select communities..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0 z-[9999] bg-[#1A1F2C] shadow-lg border border-gray-700"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search communities..." />
            <CommandList>
              <CommandEmpty>No communities found.</CommandEmpty>
              <CommandGroup>
                {communities.map((community) => (
                  <CommandItem
                    key={community.id}
                    onSelect={() => toggleCommunity(community.id)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
                      <img
                        src={getAvatarUrl(community.avatar)}
                        alt={community.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span>{community.name}</span>
                      <span className="text-xs text-muted-foreground">{formatMembers(community.userCount)}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCommunities.includes(community.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCommunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedCommunities.map((id) => {
              const community = communities.find((c) => c.id === id);
              if (!community) return null;
              return (
                <div key={community.id} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted overflow-hidden">
                    <img
                      src={getAvatarUrl(community.avatar)}
                      alt={community.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="truncate max-w-[100px]">{community.name}</span>
                </div>
              );
            })}
          </div>
          <Button className="w-full" onClick={onShare} disabled={selectedCommunities.length === 0}>
            <Users className="mr-2 h-4 w-4" />
            Share to Communities
          </Button>
        </div>
      )}
    </div>
  );
}

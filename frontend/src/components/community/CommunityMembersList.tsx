
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import getRelativeTime from "@/lib/date"


interface CommunityMembersListProps {
  members: CommunityMember[];
}

interface CommunityMember {
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string, name: string, avatar: string }
}



export const CommunityMembersList = ({ members }: CommunityMembersListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredMembers = members.filter((member) =>
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск участников..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-black/20 border-white/10"
        />
      </div>
      
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <div 
              key={member.user.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarImage src={member.user.avatar} alt={member.user.name} />
                  <AvatarFallback className="text-xs">{member.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-sm">{member.user.name}</span>
                    {member.role === "ADMIN" && "MODERATOR" && (
                      <div className="ml-2 flex items-center text-xs text-primary">
                        <Shield className="w-3 h-3 mr-1" />
                        Модератор
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Присоединился {getRelativeTime(member.joinedAt)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                Профиль
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

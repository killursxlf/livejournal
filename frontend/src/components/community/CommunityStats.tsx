
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Activity, UserPlus } from "lucide-react";

interface CommunityStatsProps {
  memberCount: number;
  postCount: number;
  activeMembers: number;
  newMembersToday: number;
}

export const CommunityStats = ({ 
  memberCount, 
  postCount, 
  activeMembers, 
  newMembersToday 
}: CommunityStatsProps) => {
  return (
    <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-primary" />
          Статистика
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-black/30 flex flex-col items-center justify-center">
            <Users className="w-5 h-5 text-primary mb-2" />
            <span className="text-lg font-semibold">{memberCount}</span>
            <span className="text-xs text-muted-foreground">Участников</span>
          </div>
          <div className="p-3 rounded-lg bg-black/30 flex flex-col items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary mb-2" />
            <span className="text-lg font-semibold">{postCount}</span>
            <span className="text-xs text-muted-foreground">Публикаций</span>
          </div>
          <div className="p-3 rounded-lg bg-black/30 flex flex-col items-center justify-center">
            <Activity className="w-5 h-5 text-primary mb-2" />
            <span className="text-lg font-semibold">{activeMembers}</span>
            <span className="text-xs text-muted-foreground">Активных сегодня</span>
          </div>
          <div className="p-3 rounded-lg bg-black/30 flex flex-col items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary mb-2" />
            <span className="text-lg font-semibold">{newMembersToday}</span>
            <span className="text-xs text-muted-foreground">Новых сегодня</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

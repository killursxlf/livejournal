import { Users } from "lucide-react";

interface CommunityCardProps 
{
  name: string;
  description: string;
  members: number;
}

export function CommunityCard({ name, description, members }: CommunityCardProps) 
{
  return (
    <div className="border rounded-lg p-4 bg-background shadow-md transition hover:shadow-lg">
      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center mt-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4 mr-1" />
        {members} участников
      </div>
      <button className="mt-4 w-full bg-primary text-foreground py-2 rounded-lg hover:bg-primary/90 transition">
        Присоединиться
      </button>
    </div>
  );
}

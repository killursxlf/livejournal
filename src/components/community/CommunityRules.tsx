
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

interface CommunityRulesProps {
  rules: string[];
}

export const CommunityRules = ({ rules }: CommunityRulesProps) => {
  return (
    <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-primary" />
          Правила сообщества
        </h2>
        <ScrollArea className="h-[180px] pr-4">
          <ol className="space-y-2 pl-6 list-decimal">
            {rules.map((rule, index) => (
              <li key={index} className="text-sm text-muted-foreground/90">
                {rule}
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

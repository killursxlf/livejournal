import { Clock, Save, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface VersionType {
  id: string;
  createdAt: string;
  title?: string;
  content: string;
}

interface SidebarProps {
  postType: string;
  setPostType: (value: string) => void;
  publishDate: string;
  setPublishDate: (value: string) => void;
  publishTime: string;
  setPublishTime: (value: string) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  // Новые пропсы для версий поста:
  versions?: VersionType[];
  onSelectVersion?: (version: VersionType) => void;
  onRestoreCurrent?: () => void;
}

export default function Sidebar({
  postType,
  setPostType,
  publishDate,
  setPublishDate,
  publishTime,
  setPublishTime,
  onPublish,
  onSaveDraft,
  versions = [],
  onSelectVersion,
  onRestoreCurrent,
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-64 space-y-6 animate-fade-in">
      <div className="bg-muted p-4 rounded-md shadow">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={onSaveDraft}
            className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-muted-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors whitespace-nowrap"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Draft
          </button>
          <button
            onClick={onPublish}
            className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/80 rounded-md transition-colors"
          >
            <Send className="w-3 h-3 mr-1" />
            Publish
          </button>
        </div>
        <h2 className="text-lg font-semibold mb-2 text-foreground">Version History</h2>
        {versions.length > 0 ? (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li key={version.id}>
                <button
                  onClick={() => onSelectVersion && onSelectVersion(version)}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary focus:outline-none"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(version.createdAt).toLocaleString()}
                    {version.title ? ` — ${version.title}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No versions available</p>
        )}
        {versions.length > 0 && onRestoreCurrent && (
          <button
            onClick={onRestoreCurrent}
            className="mt-2 text-sm text-white bg-blue-700 hover:bg-blue-600 rounded-md px-2 py-1"
          >
            Return to Current Version
          </button>
        )}
      </div>
      <div className="bg-muted p-4 rounded-md shadow">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Additional Settings</h2>
        <div className="space-y-2">
          <div className="block text-sm font-medium text-muted-foreground">
            Post Type
            <DropdownMenu>
              <DropdownMenuTrigger className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background border border-border text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                {postType}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-background border border-border rounded-md">
                <DropdownMenuItem className="w-full" onClick={() => setPostType("Article")}>
                  Article
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full" onClick={() => setPostType("News")}>
                  News
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full" onClick={() => setPostType("Review")}>
                  Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <label className="block text-sm font-medium text-muted-foreground">
            Publish Date
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background border border-border text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            />
          </label>
          {publishDate && (
            <label className="block text-sm font-medium text-muted-foreground">
              Publish Time
              <input
                type="time"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background border border-border text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              />
            </label>
          )}
        </div>
      </div>
    </aside>
  );
}

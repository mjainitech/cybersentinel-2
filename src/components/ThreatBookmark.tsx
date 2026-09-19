import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { bookmarkThreat, unbookmarkThreat } from "@/services/threatService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface ThreatBookmarkProps {
  threatId: string;
  isBookmarked: boolean;
}

export function ThreatBookmark({ threatId, isBookmarked: initial }: ThreatBookmarkProps) {
  const [isBookmarked, setIsBookmarked] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!user) return null;

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      if (isBookmarked) {
        await unbookmarkThreat(threatId);
        setIsBookmarked(false);
        showToast("Bookmark removed.", "info");
      } else {
        await bookmarkThreat(threatId);
        setIsBookmarked(true);
        showToast("Bookmarked.", "success");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant={isBookmarked ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      isLoading={isSaving}
      leftIcon={isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
    >
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}

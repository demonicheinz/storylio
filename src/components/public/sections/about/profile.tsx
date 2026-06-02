import { GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { person } from "@/components/public/sections/about/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  isMobile?: boolean;
}

export function ProfileSection({ isMobile = false }: ProfileSectionProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-border/40 bg-surface/70 p-5 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl",
        isMobile ? "items-center" : "items-start",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Avatar className="size-40 border border-brand-soft/40">
          <AvatarImage src={person.avatar} alt={person.name} />
          <AvatarFallback>HZ</AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GlobeIcon className="text-brand-soft" size={20} />
          {person.location}
        </div>

        <div className="flex flex-wrap justify-center gap-3 overflow-hidden">
          {person.languages.map((language) => (
            <Badge
              key={language}
              variant="outline"
              className="h-7 rounded-full border-border/60 px-3 text-foreground/90"
            >
              {language}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}

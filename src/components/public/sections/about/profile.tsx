import { GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { person } from "@/components/public/sections/about/data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  isMobile?: boolean;
  profile?: {
    name?: string | null;
    image?: string | null;
  };
}

export function ProfileSection({
  isMobile = false,
  profile,
}: ProfileSectionProps) {
  const name = profile?.name ?? person.name;

  return (
    <aside
      className={cn(
        "flex flex-col gap-6 bg-surface/70 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl p-5 border border-border/40 rounded-3xl",
        isMobile ? "items-center" : "items-start",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <ProfileAvatar
          src={profile?.image}
          name={name}
          size={160}
          animated
          className="border border-brand-soft/40"
        />

        <div className="flex items-center gap-2 font-medium text-foreground text-sm">
          <GlobeIcon className="text-brand-soft" size={20} />
          {person.location}
        </div>

        <div className="flex flex-wrap justify-center gap-3 overflow-hidden">
          {person.languages.map((language) => (
            <Badge
              key={language}
              variant="outline"
              className="px-3 border-border/60 rounded-full h-7 text-foreground/90"
            >
              {language}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}

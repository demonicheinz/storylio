import { Avatar, AvatarFallback, AvatarImage, Badge, Icon } from "@/components/ui";
import { person } from "@/data";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  isMobile?: boolean;
}

export function ProfileSection({ isMobile = false }: ProfileSectionProps) {
  return (
    <div className={cn("flex flex-col gap-6", isMobile ? "items-center" : "items-start")}>
      <div className="flex flex-col items-center gap-4">
        {/* Profile Photo */}
        <Avatar className="border w-40 h-40">
          <AvatarImage
            src={person.avatar}
            alt={person.name}
          />
          <AvatarFallback>{person.name}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-2">
          <h1 className="flex items-center gap-2 font-medium text-foreground text-md">
            <Icon
              className="text-purple"
              name="globe"
              size={20}
            />
            {person.location}
          </h1>
        </div>

        {/* Language Info */}
        <div className="flex gap-4 overflow-hidden">
          <Badge
            variant="outline"
            size="md"
            className="rounded-full text-foreground/90"
          >
            {person.languages[0]}
          </Badge>
          <Badge
            variant="outline"
            size="md"
            className="rounded-full text-foreground/90"
          >
            {person.languages[1]}
          </Badge>
        </div>
      </div>
    </div>
  );
}

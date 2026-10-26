import { GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { person } from "@/components/public/sections/about/data";
import { cn } from "@/lib/utils";
import styles from "./about.module.css";

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
      className={cn(styles.profile, isMobile ? "items-center" : "items-start")}
    >
      <div className={styles.profileMeta}>
        <ProfileAvatar
          src={profile?.image}
          name={name}
          size={144}
          animated
          className={cn(styles.avatar, "border border-brand-soft/40")}
        />

        <div className="flex items-center gap-2 font-medium text-foreground text-sm">
          <GlobeIcon className="text-brand-soft" size={20} />
          {person.location}
        </div>

        <div className={styles.profileLanguages}>
          {person.languages.map((language) => (
            <span key={language}>{language}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}

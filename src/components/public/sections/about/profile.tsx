import { GlobeIcon, TranslateIcon } from "@phosphor-icons/react/dist/ssr";
import { person } from "@/components/public/sections/about/data";
import { cn } from "@/lib/utils";
import styles from "./about.module.css";
import { ProfilePhoto } from "./profile-photo";

interface ProfileSectionProps {
  profile?: {
    name?: string | null;
    image?: string | null;
  };
}

export function ProfileSection({ profile }: ProfileSectionProps) {
  const name = profile?.name ?? person.name;

  return (
    <aside className={styles.profile}>
      <div className={styles.profileMeta}>
        <ProfilePhoto
          src={profile?.image}
          name={name}
          className={cn(styles.avatar, "border border-brand-soft/40")}
        />

        <div
          className={cn(
            styles.location,
            "flex items-center gap-2 font-medium text-foreground text-sm",
          )}
        >
          <GlobeIcon className="text-brand-soft shrink-0" size={20} />
          {person.location}
        </div>

        <div className={styles.profileLanguages}>
          <TranslateIcon
            className="text-brand-soft shrink-0"
            size={16}
            aria-hidden="true"
          />
          {person.languages.map((language) => (
            <span key={language}>{language}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}

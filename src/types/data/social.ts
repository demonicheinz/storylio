import type { IconName } from "@/types/ui";

export interface SocialLink {
  name: string;
  icon: IconName;
  link: string;
}

export type SocialLinks = SocialLink[];

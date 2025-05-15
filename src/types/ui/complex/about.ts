export interface ExperienceProps {
  companyName: string;
  position: string;
  timeFrame: {
    start: string;
    end: string;
  };
  description?: string;
}

export interface SideNavItem {
  title: string;
  href: string;
  id: string;
}

export interface SkillProps {
  name: string;
  icon?: string;
  progress?: number;
}

export interface StudyProps {
  institution: string;
  degree: string;
  field: string;
  timeFrame: {
    start: string;
    end: string;
  };
}

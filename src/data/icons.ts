import type { IconType } from "react-icons";

// Box Icons (Bi)
import { BiLogoTailwindCss } from "react-icons/bi";

// Font Awesome (Fa)
import { FaGlobeAsia, FaLongArrowAltRight, FaLongArrowAltLeft } from "react-icons/fa";

// Font Awesome (Fa)
import {
  FaChevronUp,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaArrowRight,
  FaArrowLeft,
  FaXmark,
  FaArrowsRotate,
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa6";

// IonIcons4 (Io)
import { IoIosMenu, IoMdSearch, IoIosMail } from "react-icons/io";

// IonIcons5 (Io)
import { IoCheckmarkCircleOutline, IoWarning, IoHelpCircle } from "react-icons/io5";

// Lucide Icons (Lu)
import {
  LuCheck,
  LuEye,
  LuEyeClosed,
  LuClipboard,
  LuHouse,
  LuCircleUser,
  LuFolderCode,
  LuLoader,
  LuBell,
  LuPlus,
  LuMinus,
} from "react-icons/lu";

// Material Design Icons (Md)
import {
  MdWarning,
  MdError,
  MdSettings,
  MdLogout,
  MdEdit,
  MdDelete,
  MdShare,
  MdFormatQuote,
} from "react-icons/md";

// Remix Icons (Ri)
import { RiArticleLine } from "react-icons/ri";

// Tabler Icons (Tb)
import {
  TbBrandNodejs,
  TbBrandReact,
  TbBrandNextjs,
  TbBrandTypescript,
  TbBrandReactNative,
  TbBrandFlutter,
  TbBrandFigma,
  TbBrandAdobeXd,
  TbBrandVue,
  TbBrandAngular,
  TbBrandGraphql,
  TbBrandVercel,
  TbBrandDocker,
  TbBrandGit,
  TbServer,
  TbBrandPython,
  TbBrandJavascript,
  TbBrandAws,
  TbBrandFirebase,
  TbBrandGolang,
  TbBrandLaravel,
  TbBrandMongodb,
  TbBrandMysql,
  TbBrandStripe,
  TbBrandSupabase,
  TbBrandSvelte,
  TbBrandThreejs,
  TbBrandAstro,
  TbBrandKotlin,
  TbBrandSwift,
  TbBrandRust,
  TbBrandPrisma,
  TbClipboardCopy,
  TbPhoto,
} from "react-icons/tb";

export const iconLibrary: Record<string, IconType> = {
  // Navigasi & UI
  chevronUp: FaChevronUp,
  chevronDown: FaChevronDown,
  chevronRight: FaChevronRight,
  chevronLeft: FaChevronLeft,
  arrowRight: FaArrowRight,
  arrowLeft: FaArrowLeft,
  arrowRightLong: FaLongArrowAltRight,
  arrowLeftLong: FaLongArrowAltLeft,
  close: FaXmark,
  menu: IoIosMenu,
  search: IoMdSearch,
  globe: FaGlobeAsia,
  quote: MdFormatQuote,

  // Status & Feedback
  check: LuCheck,
  refresh: FaArrowsRotate,
  info: IoWarning,
  warning: MdWarning,
  error: MdError,
  success: IoCheckmarkCircleOutline,
  helpCircle: IoHelpCircle,
  loader: LuLoader,

  // Sosial Media & Kontak
  email: IoIosMail,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  discord: FaDiscord,
  github: FaGithub,
  linkedin: FaLinkedin,

  // Navigasi Aplikasi
  home: LuHouse,
  about: LuCircleUser,
  projects: LuFolderCode,
  blog: RiArticleLine,
  gallery: TbPhoto,
  settings: MdSettings,
  notifications: LuBell,
  logOut: MdLogout,

  // Aksi
  edit: MdEdit,
  trash: MdDelete,
  eye: LuEye,
  eyeOff: LuEyeClosed,
  copy: TbClipboardCopy,
  clipboard: LuClipboard,
  share: MdShare,
  plus: LuPlus,
  minus: LuMinus,

  // Tech Stack
  react: TbBrandReact,
  nextjs: TbBrandNextjs,
  typescript: TbBrandTypescript,
  nodejs: TbBrandNodejs,
  tailwind: BiLogoTailwindCss,
  flutter: TbBrandFlutter,
  reactNative: TbBrandReactNative,
  figma: TbBrandFigma,
  adobeXd: TbBrandAdobeXd,
  vue: TbBrandVue,
  angular: TbBrandAngular,
  graphql: TbBrandGraphql,
  vercel: TbBrandVercel,
  docker: TbBrandDocker,
  git: TbBrandGit,
  python: TbBrandPython,
  javascript: TbBrandJavascript,
  aws: TbBrandAws,
  firebase: TbBrandFirebase,
  golang: TbBrandGolang,
  laravel: TbBrandLaravel,
  mongodb: TbBrandMongodb,
  mysql: TbBrandMysql,
  stripe: TbBrandStripe,
  supabase: TbBrandSupabase,
  svelte: TbBrandSvelte,
  threejs: TbBrandThreejs,
  astro: TbBrandAstro,
  kotlin: TbBrandKotlin,
  swift: TbBrandSwift,
  rust: TbBrandRust,
  prisma: TbBrandPrisma,
  server: TbServer,
};

// Tipe untuk komponen Icon
export type IconName = keyof typeof iconLibrary;

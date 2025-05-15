import type { IconType } from "react-icons";

// Box Icons (Bi)
import { BiLogoTailwindCss } from "react-icons/bi";

// Font Awesome (Fa)
import { FaGlobeAsia, FaLongArrowAltLeft, FaLongArrowAltRight } from "react-icons/fa";

// Font Awesome (Fa)
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowsRotate,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaXmark,
} from "react-icons/fa6";

// IonIcons4 (Io)
import { IoIosMail, IoIosMenu, IoMdSearch } from "react-icons/io";

// IonIcons5 (Io)
import {
  IoCheckmarkCircleOutline,
  IoHelpCircle,
  IoWarning,
  IoWarningOutline,
} from "react-icons/io5";

// Lucide Icons (Lu)
import {
  LuBell,
  LuCheck,
  LuCircleUser,
  LuCircleX,
  LuClipboard,
  LuEye,
  LuEyeClosed,
  LuFolder,
  LuFolderCode,
  LuHouse,
  LuLoader,
  LuMinus,
  LuPlus,
  LuRadioTower,
  LuSearchX,
} from "react-icons/lu";

// Material Design Icons (Md)
import { MdDelete, MdEdit, MdFormatQuote, MdLogout, MdShare } from "react-icons/md";

// Remix Icons (Ri)
import { RiArticleLine, RiGitBranchLine } from "react-icons/ri";

// Tabler Icons (Tb)
import {
  TbArrowUpRight,
  TbBrandAdobeXd,
  TbBrandAngular,
  TbBrandAstro,
  TbBrandAws,
  TbBrandCss3,
  TbBrandDocker,
  TbBrandFigma,
  TbBrandFirebase,
  TbBrandFlutter,
  TbBrandGit,
  TbBrandGolang,
  TbBrandGraphql,
  TbBrandHtml5,
  TbBrandJavascript,
  TbBrandKotlin,
  TbBrandLaravel,
  TbBrandMongodb,
  TbBrandMysql,
  TbBrandNextjs,
  TbBrandNodejs,
  TbBrandPrisma,
  TbBrandPython,
  TbBrandReact,
  TbBrandReactNative,
  TbBrandRust,
  TbBrandStripe,
  TbBrandSupabase,
  TbBrandSvelte,
  TbBrandSwift,
  TbBrandThreejs,
  TbBrandTypescript,
  TbBrandVercel,
  TbBrandVscode,
  TbBrandVue,
  TbClipboardCopy,
  TbFileText,
  TbFolder,
  TbJson,
  TbMarkdown,
  TbPencil,
  TbPhoto,
  TbSearch,
  TbServer,
  TbSettings,
} from "react-icons/tb";

export const iconLibrary: Record<string, IconType> = {
  // Navigasi & UI
  chevronUp: FaChevronUp,
  chevronDown: FaChevronDown,
  chevronRight: FaChevronRight,
  chevronLeft: FaChevronLeft,
  arrowRight: FaArrowRight,
  arrowLeft: FaArrowLeft,
  arrowUpRight: TbArrowUpRight,
  arrowRightLong: FaLongArrowAltRight,
  arrowLeftLong: FaLongArrowAltLeft,
  close: FaXmark,
  menu: IoIosMenu,
  search: IoMdSearch,
  searchX: LuSearchX,
  globe: FaGlobeAsia,
  quote: MdFormatQuote,

  // Status & Feedback
  check: LuCheck,
  refresh: FaArrowsRotate,
  info: IoWarning,
  warning: IoWarningOutline,
  error: LuCircleX,
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
  folder: LuFolder,
  blog: RiArticleLine,
  gallery: TbPhoto,
  settings: TbSettings,
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
  vscode: TbBrandVscode,

  // File Types
  html: TbBrandHtml5,
  css: TbBrandCss3,
  json: TbJson,
  markdown: TbMarkdown,
  document: TbFileText,
  fileCode: TbPencil,
  folderOpen: TbFolder,
  settingsGear: TbSettings,
  searchFile: TbSearch,

  // Lainnya
  gitBranch: RiGitBranchLine,
  radioTower: LuRadioTower,
};

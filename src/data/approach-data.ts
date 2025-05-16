import type { ApproachCard } from "@/types/data";

/**
 * Data untuk bagian Approach
 */
export const approachData: ApproachCard[] = [
  {
    id: "planning-strategy",
    title: "Planning & Strategy",
    phase: "Phase 1",
    description:
      "We'll collaborate to map out your website's goals, target audience, and key functionalities. We'll discuss things like site structure, navigation, and content requirements.",
    backgroundClassName: "bg-emerald-900",
    animationSpeed: 3,
    colors: undefined,
    dotSize: undefined,
  },
  {
    id: "development-update",
    title: "Development & Progress Update",
    phase: "Phase 2",
    description:
      "Once we agree on the plan, I cue my lofi playlist and dive into coding. From initial sketches to polished code, I keep you updated every step of the way.",
    backgroundClassName: "bg-pink-900",
    animationSpeed: 3,
    colors: [
      [255, 166, 158],
      [221, 255, 247],
    ],
    dotSize: 2,
  },
  {
    id: "development-launch",
    title: "Development & Launch",
    phase: "Phase 3",
    description:
      "This is where the magic happens! Based on the approved design, I'll translate everything into functional code, building your website from the ground up.",
    backgroundClassName: "bg-sky-600",
    animationSpeed: 3,
    colors: [[125, 211, 252]],
    dotSize: undefined,
  },
];

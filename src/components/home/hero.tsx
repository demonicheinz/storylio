import { ConnectButton, Spotlight, TextGenerateEffect } from "@/components/ui";
import type { HeroProps } from "@/types/ui";
import Link from "next/link";

export function HeroSection({
  title = "Transforming Concepts into Seamless User Experiences",
  subtitle = "Dynamic Web Magic with Next.js",
  description = "Hi! I'm Heinz, a Web Developer based in Central Java, Indonesia.",
  buttonText = "About me",
  buttonLink = "/about",
}: HeroProps = {}) {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-screen">
      {/* Background elements with lower priority */}
      <div>
        <Spotlight />
        {/* <Spotlight /> */}
      </div>

      {/* Main content - critical LCP element */}
      <div className="z-10 relative flex justify-center px-4">
        <div className="flex flex-col justify-center items-center max-w-[89vw] lg:max-w-[60vw] md:max-w-2xl">
          <p className="max-w-80 text-blue-100 text-xs text-center uppercase tracking-widest">
            {subtitle}
          </p>

          {/* Headline - Critical for LCP */}
          <TextGenerateEffect
            words={title}
            highlightWords={["User", "Experiences"]}
            className="text-[40px] text-foreground dark:text-white md:text-5xl lg:text-6xl text-center"
          />

          <p className="mb-6 text-blue-100 text-sm md:text-lg lg:text-2xl text-center md:tracking-wider">
            {description}
          </p>

          {/* Connect Button */}
          <Link href={buttonLink}>
            <ConnectButton
              iconName="arrowUpRight"
              imageSrc="/images/heinz.jpg"
              imageAlt="Heinz Avatar"
              imageProps={{ className: "rounded-full" }}
              size="lg"
              variant="default"
              iconSize={20}
            >
              {buttonText}
            </ConnectButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

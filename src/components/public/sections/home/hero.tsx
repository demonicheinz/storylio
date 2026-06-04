import { MagicButton } from "@/components/common";
import { Spotlight, TextGenerateEffect } from "@/components/effects";

export interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  avatar?: string | null;
  avatarAlt?: string;
}

export function HeroSection({
  title = "Transforming Concepts into Seamless User Experiences",
  subtitle = "Dynamic Web Magic with Next.js",
  description = "Hi! I'm Heinz, a Full Stack Developer based in Central Java, Indonesia.",
  buttonText = "About me",
  buttonLink = "/about",
  avatar,
  avatarAlt = "Heinz Avatar",
}: HeroProps = {}) {
  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center">
      {/* Background elements with lower priority */}
      <div>
        <Spotlight />
        {/* <Spotlight /> */}
      </div>

      {/* Main content - critical LCP element */}
      <div className="relative z-10 flex justify-center px-4">
        <div className="flex max-w-[89vw] flex-col items-center justify-center md:max-w-2xl lg:max-w-[60vw]">
          <p className="max-w-80 text-center text-xs tracking-widest text-blue-100 uppercase">
            {subtitle}
          </p>

          {/* Headline - Critical for LCP */}
          <TextGenerateEffect
            as="h1"
            words={title}
            highlightWords={["User", "Experiences"]}
            className="text-center text-[40px] text-foreground md:text-5xl lg:text-6xl dark:text-white"
          />

          <p className="mb-6 text-center text-sm text-blue-100 md:text-lg md:tracking-wider lg:text-2xl">
            {description}
          </p>

          {/* Connect Button */}
          <MagicButton
            href={buttonLink}
            iconName="arrowUpRight"
            imageSrc={avatar ?? "/images/heinz.jpg"}
            imageAlt={avatarAlt}
            size="lg"
            variant="default"
            iconSize={20}
          >
            {buttonText}
          </MagicButton>
        </div>
      </div>
    </section>
  );
}

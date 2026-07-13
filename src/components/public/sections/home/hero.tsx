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
    <section className="relative flex flex-col justify-center items-center w-full h-screen">
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
            as="h1"
            words={title}
            highlightWords={["User", "Experiences"]}
            className="text-[40px] text-foreground dark:text-white md:text-5xl lg:text-6xl text-center"
          />

          <p className="mb-6 text-blue-100 text-sm md:text-lg lg:text-2xl text-center md:tracking-wider">
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

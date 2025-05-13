import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { ConnectButton } from "@/components/ui/connect-button";

const Hero = () => {
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
            Dynamic Web Magic with Next.js
          </p>

          {/* Headline - Critical for LCP */}
          <TextGenerateEffect
            words="Transforming Concepts into Seamless User Experiences"
            highlightWords={["User", "Experiences"]}
            className="text-[40px] text-foreground dark:text-white md:text-5xl lg:text-6xl text-center"
          />

          <p className="mb-6 text-blue-100 text-sm md:text-lg lg:text-2xl text-center md:tracking-wider">
            Hi! I&apos;m Heinz, a Web Developer based in Central Java, Indonesia.
          </p>

          {/* Connect Button */}
          <a href="/about">
            <ConnectButton
              iconName="arrowUpRight"
              imageSrc="/images/heinz.jpg"
              imageAlt="Heinz Avatar"
              imageProps={{ className: "rounded-full" }}
              size="lg"
              variant="default"
              iconSize={20}
            >
              About me
            </ConnectButton>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;

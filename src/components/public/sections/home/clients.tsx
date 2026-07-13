"use client";

import { ImageIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { InfiniteCards } from "@/components/common";

export type HomeLogo = {
  id: string;
  label: string;
  imageUrl: string | null;
  order: number;
};

export type HomeTestimonial = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  order: number;
};

export interface ClientsProps {
  title?: string;
  subtitle?: string;
  logos: HomeLogo[];
  testimonials: HomeTestimonial[];
}

export function ClientsSection({
  title = "Kind words from",
  subtitle = "satisfied clients",
  logos,
  testimonials,
}: ClientsProps) {
  const testimonialItems = testimonials.map((testimonial) => ({
    quote: testimonial.content,
    name: testimonial.name,
    title: [testimonial.role, testimonial.company].filter(Boolean).join(" at "),
    avatar: testimonial.avatar ?? undefined,
  }));

  return (
    <section id="testimonials" className="py-10">
      <h2 className="heading">
        {title}
        <span className="text-brand-soft"> {subtitle}</span>
      </h2>

      <div className="flex flex-col items-center max-lg:mt-10">
        {testimonialItems.length > 0 ? (
          <div className="relative flex flex-col justify-center items-center bg-transparent w-screen h-[50vh] md:h-120 overflow-hidden antialiased">
            <InfiniteCards
              clientItems={testimonialItems}
              direction="left"
              speed="normal"
            />
          </div>
        ) : (
          <div className="bg-surface/45 backdrop-blur-xl mt-10 px-6 py-8 border border-border/60 border-dashed rounded-3xl text-muted-foreground text-sm text-center leading-7">
            Testimonials will appear here when they are added from the CMS.
          </div>
        )}

        {logos.length > 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-10 max-lg:mt-10">
            {logos.map((logo) => (
              <LogoCard key={logo.id} logo={logo} />
            ))}
          </div>
        ) : (
          <div className="bg-surface/45 backdrop-blur-xl mt-10 px-6 py-8 border border-border/60 border-dashed rounded-3xl text-muted-foreground text-sm text-center leading-7">
            Client and technology logos will appear here when they are added
            from the CMS.
          </div>
        )}
      </div>
    </section>
  );
}

function LogoCard({ logo }: { logo: HomeLogo }) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(logo.imageUrl) && !hasImageError;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex justify-center items-center bg-surface/90 shadow-[0_0_32px_rgba(139,92,246,0.08)] backdrop-blur-md px-5 py-3 border border-border/40 hover:border-brand-soft/40 rounded-2xl min-w-32 min-h-14 font-semibold text-blue-100 hover:text-white text-sm transition-colors"
    >
      {shouldShowImage && logo.imageUrl ? (
        <Image
          src={logo.imageUrl}
          alt={logo.label}
          width={120}
          height={40}
          className="w-auto h-8 object-contain"
          loading="lazy"
          unoptimized
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="inline-flex items-center gap-2">
          {!logo.imageUrl || hasImageError ? (
            <ImageIcon size={16} className="text-brand-soft" />
          ) : null}
          {logo.label}
        </span>
      )}
    </motion.div>
  );
}

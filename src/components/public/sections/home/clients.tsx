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
          <div className="relative flex h-[50vh] w-screen flex-col items-center justify-center overflow-hidden bg-transparent antialiased md:h-120">
            <InfiniteCards
              clientItems={testimonialItems}
              direction="left"
              speed="normal"
            />
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-surface/45 px-6 py-8 text-center text-sm leading-7 text-muted-foreground backdrop-blur-xl">
            Testimonials will appear here when they are added from the CMS.
          </div>
        )}

        {logos.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-4 max-lg:mt-10 md:gap-10">
            {logos.map((logo) => (
              <LogoCard key={logo.id} logo={logo} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-surface/45 px-6 py-8 text-center text-sm leading-7 text-muted-foreground backdrop-blur-xl">
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
      className="flex min-h-14 min-w-32 items-center justify-center rounded-2xl border border-border/40 bg-surface/90 px-5 py-3 text-sm font-semibold text-blue-100 shadow-[0_0_32px_rgba(139,92,246,0.08)] backdrop-blur-md transition-colors hover:border-brand-soft/40 hover:text-white"
    >
      {shouldShowImage && logo.imageUrl ? (
        <Image
          src={logo.imageUrl}
          alt={logo.label}
          width={120}
          height={40}
          className="h-8 w-auto object-contain"
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

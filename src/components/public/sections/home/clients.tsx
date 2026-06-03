"use client";

import Image from "next/image";
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
          <div className="relative flex h-[50vh] w-screen flex-col items-center justify-center overflow-hidden bg-transparent antialiased md:h-[30rem]">
            <InfiniteCards
              clientItems={testimonialItems}
              direction="left"
              speed="normal"
            />
          </div>
        ) : null}

        {logos.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-4 max-lg:mt-10 md:gap-10">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="flex min-h-14 min-w-32 items-center justify-center rounded-2xl border border-border/40 bg-surface/90 px-5 py-3 text-sm font-semibold text-blue-100 shadow-[0_0_32px_rgba(139,92,246,0.08)] backdrop-blur-md transition-colors hover:border-brand-soft/40 hover:text-white"
              >
                {logo.imageUrl ? (
                  <Image
                    src={logo.imageUrl}
                    alt={logo.label}
                    width={120}
                    height={40}
                    className="h-8 w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span>{logo.label}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

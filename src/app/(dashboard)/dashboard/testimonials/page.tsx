import { connection } from "next/server";
import { TestimonialsManager } from "@/features/dashboard/testimonials/components/testimonial-form";
import { db } from "@/lib/db";

async function getTestimonials() {
  return db.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      role: true,
      company: true,
      avatar: true,
      content: true,
      order: true,
      createdAt: true,
    },
  });
}

export default async function TestimonialsPage() {
  await connection();

  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Testimonials</h1>
        <p className="mt-2 text-muted-foreground">
          Manage Home page client quotes, avatars, attribution, and display
          order.
        </p>
      </div>

      <TestimonialsManager
        testimonials={testimonials.map((testimonial) => ({
          ...testimonial,
          createdAt: testimonial.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

import type { PrismaClient } from "@/generated/prisma";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CTO",
    company: "TechStart Inc.",
    content:
      "Heinz delivered an exceptional e-commerce platform that exceeded our expectations. His attention to detail and technical expertise made all the difference.",
    isVisible: true,
    order: 1,
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    company: "Innovate Labs",
    content:
      "Working with Heinz was a pleasure. He understood our requirements perfectly and delivered a scalable solution that has grown with our business.",
    isVisible: true,
    order: 2,
  },
  {
    name: "Emma Davis",
    role: "Founder",
    company: "Creative Studio",
    content:
      "The website Heinz built for us is fast, beautiful, and exactly what we envisioned. Highly recommend for any web project.",
    isVisible: true,
    order: 3,
  },
];

export async function seedTestimonials(db: PrismaClient) {
  if ((await db.testimonial.count()) > 0) {
    console.log("Testimonials already exist");
    return;
  }

  await db.testimonial.createMany({ data: testimonials });
  console.log("Created sample testimonials");
}

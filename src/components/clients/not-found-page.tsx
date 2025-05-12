"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NotFoundPageProps {
  title?: string;
  description?: string;
  emailContact?: string;
  emailText?: string;
  backText?: string;
  contactText?: string;
  footerText?: string;
}

export function NotFoundPage({
  title = "Halaman Tidak Ditemukan",
  description = "Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan, dihapus, atau mungkin tidak pernah ada.",
  emailContact = "contact@heinz.id",
  emailText = "contact@heinz.id",
  backText = "Kembali ke Beranda",
  contactText = "Hubungi Kami",
  footerText = "Jika Anda yakin ini adalah kesalahan, silakan hubungi kami melalui email di",
}: NotFoundPageProps) {
  // Generate static random values during initial client render to prevent hydration mismatch
  const backgroundElements = Array(5)
    .fill(0)
    .map((_, i) => ({
      key: i,
      isPrimary: i % 2 === 0,
      width: 100 + Math.floor(i * 30),
      height: 100 + Math.floor(i * 30),
      top: `${10 + i * 20}%`,
      left: `${15 + i * 15}%`,
      animationY: 30 + i * 10,
      animationX: 20 + i * 15,
      duration: 15 + i * 2,
    }));

  return (
    <div className="relative flex flex-col justify-center items-center bg-background px-4 py-12 min-h-screen overflow-hidden">
      {/* Animated background elements */}
      <div className="z-0 absolute inset-0 overflow-hidden">
        {backgroundElements.map((elem) => (
          <motion.div
            key={elem.key}
            className={cn(
              "absolute rounded-full opacity-20",
              elem.isPrimary ? "bg-primary" : "bg-secondary",
            )}
            style={{
              width: `${elem.width}px`,
              height: `${elem.height}px`,
              top: elem.top,
              left: elem.left,
            }}
            animate={{
              y: [0, elem.animationY, 0],
              x: [0, elem.animationX, 0],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="z-10 max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <motion.h1
              className="bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2 font-extrabold text-transparent text-8xl"
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.8,
                type: "spring",
                stiffness: 200,
              }}
            >
              404
            </motion.h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full h-1"
            />
            <h2 className="mb-4 font-semibold text-2xl">{title}</h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-card/30 backdrop-blur-sm mb-8 p-8 border border-border rounded-xl">
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1,
                  }}
                >
                  <Icon
                    name="searchX"
                    className="text-muted-foreground"
                    size={64}
                  />
                </motion.div>
              </div>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </motion.div>

          <motion.div
            className="flex sm:flex-row flex-col justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button
              asChild
              size="lg"
              className="group"
            >
              <Link
                href="/"
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center">
                  <Icon
                    name="home"
                    size={24}
                  />
                </span>
                <span>{backText}</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              asChild
              className="group"
            >
              <a
                href={`mailto:${emailContact}`}
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center">
                  <Icon
                    name="email"
                    size={24}
                  />
                </span>
                <span>{contactText}</span>
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="z-10 mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <p className="text-muted-foreground text-sm">
          {footerText}{" "}
          <a
            href={`mailto:${emailContact}`}
            className="font-medium text-primary hover:underline"
          >
            {emailText}
          </a>{" "}
          atau media sosial.
        </p>
      </motion.div>
    </div>
  );
}

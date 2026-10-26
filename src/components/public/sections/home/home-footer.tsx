"use client";
import { ArrowUpIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { scrollPageTo } from "@/lib/page-scroll";
import homeStyles from "./home.module.css";
import styles from "./home-footer.module.css";

export type HomeSocialLink = { href: string; label: string };
export function HomeFooter({
  year,
  name,
  socialLinks,
  email,
}: {
  year: string | number;
  name: string;
  socialLinks: HomeSocialLink[];
  email?: string | null;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [curtainHeight, setCurtainHeight] = useState<number>();
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const wide = matchMedia("(min-width: 1024px) and (min-height: 800px)");
    const sync = () => {
      const height = Math.ceil(footer.getBoundingClientRect().height);
      setCurtainHeight(
        !reduceMotion && wide.matches && height <= window.innerHeight - 24
          ? height
          : undefined,
      );
    };
    const observer = new ResizeObserver(sync);
    observer.observe(footer);
    wide.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [reduceMotion]);

  const revealFocusedLinks = () => {
    const wrapper = wrapperRef.current;
    if (curtainHeight && wrapper)
      scrollPageTo(
        scrollY + wrapper.getBoundingClientRect().bottom - innerHeight,
        {
          immediate: true,
        },
      );
  };
  return (
    <div
      ref={wrapperRef}
      className={curtainHeight ? styles.curtain : undefined}
      style={curtainHeight ? { height: curtainHeight } : undefined}
      data-home-footer-wrapper
    >
      <footer
        ref={footerRef}
        data-home-footer
        className={`${homeStyles.surface} ${styles.footer}`}
        onFocusCapture={revealFocusedLinks}
      >
        <div className={styles.content}>
          <div className={styles.top}>
            <motion.div
              initial={false}
              whileInView={
                reduceMotion ? undefined : { y: [16, 0], opacity: [0.7, 1] }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className={styles.invitation}
            >
              <h2>
                Got something in mind?
                <br />
                Let’s talk.
              </h2>
              {email ? (
                <a href={`mailto:${email}`} className={styles.contact}>
                  {email}
                  <ArrowUpRightIcon aria-hidden="true" size={18} />
                </a>
              ) : (
                <Link href="/about" className={styles.contact}>
                  More about me
                  <ArrowUpRightIcon aria-hidden="true" size={18} />
                </Link>
              )}
            </motion.div>
            <motion.nav
              initial={false}
              whileInView={
                reduceMotion ? undefined : { y: [16, 0], opacity: [0.7, 1] }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              aria-label="Footer navigation"
              className={styles.navigation}
            >
              <h3>Explore</h3>
              <ul>
                {[
                  { label: "Home", href: "/" },
                  { label: "About", href: "/about" },
                  { label: "Projects", href: "/projects" },
                  { label: "Writing", href: "/blog" },
                  { label: "Gallery", href: "/gallery" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
            {socialLinks.length > 0 && (
              <motion.div
                initial={false}
                whileInView={
                  reduceMotion ? undefined : { y: [16, 0], opacity: [0.7, 1] }
                }
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={styles.navigation}
              >
                <h3>Elsewhere</h3>
                <ul>
                  {socialLinks.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                        <ArrowUpRightIcon aria-hidden="true" size={14} />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
          <div className={styles.socialStrip}>
            <p>Ahmad Haizul Amany</p>
            <a
              href="#home-title"
              className={styles.backToTop}
              onClick={(event) => {
                event.preventDefault();
                scrollPageTo(0, { immediate: !!reduceMotion });
                const title = document.getElementById("home-title");
                title?.setAttribute("tabindex", "-1");
                title?.focus({ preventScroll: true });
              }}
            >
              Back to top <ArrowUpIcon aria-hidden="true" size={16} />
            </a>
          </div>
          <div className={styles.wordmarkClip} aria-hidden="true">
            <motion.div
              className={styles.wordmark}
              style={reduceMotion ? undefined : { y, scale }}
            >
              {name}
            </motion.div>
          </div>
          <div className={styles.bottom}>
            <p>
              &copy; {year} {name}. All rights reserved.
            </p>
            <Link href="/projects">
              Explore the work <ArrowUpRightIcon aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

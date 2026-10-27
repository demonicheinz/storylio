"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { scrollPageTo } from "@/lib/page-scroll";
import {
  buildProjectPageHref,
  getProjectPageItems,
  type getProjectPagination,
} from "@/lib/project-pagination";
import styles from "./projects.module.css";

export function ProjectsPagination({
  pagination,
}: {
  pagination: ReturnType<typeof getProjectPagination>;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const initiated = useRef(false);
  useEffect(() => {
    if (!initiated.current) return;
    initiated.current = false;
    const target = document.getElementById("projects-list");
    if (target) {
      scrollPageTo(target);
      target.focus({ preventScroll: true });
    }
  }, [pagination.page]);
  if (pagination.pageCount < 2) return null;
  const href = (page: number) => buildProjectPageHref(pathname, search, page);
  const navigate = () => {
    initiated.current = true;
  };
  return (
    <Pagination aria-label="Project pages" className={styles.pagination}>
      <p className={styles.result}>
        Showing {pagination.start}–{pagination.end} of {pagination.total}{" "}
        projects
      </p>
      <PaginationContent>
        <PaginationItem>
          {pagination.page > 1 ? (
            <Link
              href={href(pagination.page - 1)}
              scroll={false}
              onNavigate={navigate}
              className={styles.pageLink}
              aria-label="Previous project page"
            >
              <CaretLeftIcon size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span
              className={styles.pageLink}
              aria-disabled="true"
              aria-label="Previous project page"
            >
              <CaretLeftIcon size={18} aria-hidden="true" />
            </span>
          )}
        </PaginationItem>
        {getProjectPageItems(pagination.page, pagination.pageCount).map(
          (item, index) => (
            <PaginationItem
              key={`${item}-${index}`}
              className={
                item === pagination.page ? undefined : styles.otherPage
              }
            >
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : item === pagination.page ? (
                <span
                  className={styles.pageLink}
                  aria-current="page"
                  aria-label={`Page ${item} of ${pagination.pageCount}`}
                >
                  <span className={styles.desktopPage}>{item}</span>
                  <span className={styles.mobilePage}>
                    {item} / {pagination.pageCount}
                  </span>
                </span>
              ) : (
                <Link
                  href={href(item)}
                  scroll={false}
                  onNavigate={navigate}
                  className={styles.pageLink}
                  aria-label={`Project page ${item}`}
                >
                  {item}
                </Link>
              )}
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          {pagination.page < pagination.pageCount ? (
            <Link
              href={href(pagination.page + 1)}
              scroll={false}
              onNavigate={navigate}
              className={styles.pageLink}
              aria-label="Next project page"
            >
              <CaretRightIcon size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span
              className={styles.pageLink}
              aria-disabled="true"
              aria-label="Next project page"
            >
              <CaretRightIcon size={18} aria-hidden="true" />
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

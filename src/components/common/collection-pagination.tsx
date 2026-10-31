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
import {
  buildPageHref,
  getPageItems,
  type getPagination,
} from "@/lib/archive-pagination";
import { scrollPageTo } from "@/lib/page-scroll";
import styles from "./collection-pagination.module.css";

export function CollectionPagination({
  pagination,
  label = "Project",
  noun = "projects",
  targetId = "projects-list",
}: {
  pagination: ReturnType<typeof getPagination>;
  label?: string;
  noun?: string;
  targetId?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const initiated = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A completed page navigation must scroll/focus its collection once.
  useEffect(() => {
    if (!initiated.current) return;
    initiated.current = false;
    const target = document.getElementById(targetId);
    if (target) {
      scrollPageTo(target);
      target.focus({ preventScroll: true });
    }
  }, [pagination.page, targetId]);
  if (pagination.pageCount < 2) return null;
  const href = (page: number) => buildPageHref(pathname, search, page);
  const navigate = () => {
    initiated.current = true;
  };
  return (
    <Pagination aria-label={`${label} pages`} className={styles.pagination}>
      <p className={styles.result}>
        Showing {pagination.start}–{pagination.end} of {pagination.total} {noun}
      </p>
      <PaginationContent>
        <PaginationItem>
          {pagination.page > 1 ? (
            <Link
              href={href(pagination.page - 1)}
              scroll={false}
              onNavigate={navigate}
              className={styles.pageLink}
              aria-label={`Previous ${label.toLowerCase()} page`}
            >
              <CaretLeftIcon size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span className={styles.pageLink} aria-disabled="true">
              <CaretLeftIcon size={18} aria-hidden="true" />
              <span className="sr-only">
                Previous {label.toLowerCase()} page
              </span>
            </span>
          )}
        </PaginationItem>
        {getPageItems(pagination.page, pagination.pageCount).map(
          (item, index) => (
            <PaginationItem
              // biome-ignore lint/suspicious/noArrayIndexKey: This item sequence includes distinct stateless ellipsis gaps, not mutable data rows.
              key={`${item}-${index}`}
              className={
                item === pagination.page ? undefined : styles.otherPage
              }
            >
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : item === pagination.page ? (
                <span className={styles.pageLink} aria-current="page">
                  <span className={styles.desktopPage} aria-hidden="true">
                    {item}
                  </span>
                  <span className={styles.mobilePage} aria-hidden="true">
                    {item} / {pagination.pageCount}
                  </span>
                  <span className="sr-only">
                    Page {item} of {pagination.pageCount}
                  </span>
                </span>
              ) : (
                <Link
                  href={href(item)}
                  scroll={false}
                  onNavigate={navigate}
                  className={styles.pageLink}
                  aria-label={`${label} page ${item}`}
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
              aria-label={`Next ${label.toLowerCase()} page`}
            >
              <CaretRightIcon size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span className={styles.pageLink} aria-disabled="true">
              <CaretRightIcon size={18} aria-hidden="true" />
              <span className="sr-only">Next {label.toLowerCase()} page</span>
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

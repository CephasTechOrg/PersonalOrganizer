"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/ui/lib/api";
import {
  ArchiveIcon,
  BellIcon,
  CalendarIcon,
  HomeIcon,
  OppsIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TasksIcon,
} from "@/ui/components/icons";
import type { ReactNode } from "react";
import { OwnerProvider } from "./OwnerContext";
import { QuickAddProvider, useQuickAdd } from "./QuickAddProvider";
import { ToastProvider } from "./ToastProvider";
import styles from "./AppShell.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { width?: number; height?: number }) => ReactNode;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/opportunities", label: "Opportunities", icon: OppsIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/archive", label: "Archive", icon: ArchiveIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/opportunities", label: "Opps", icon: OppsIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellChrome({ ownerEmail, children }: { ownerEmail: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const quickAdd = useQuickAdd();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      quickAdd.open();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [quickAdd]);

  const avatarLabel = ownerEmail.slice(0, 2).toUpperCase();

  async function logout() {
    await api.post("/api/auth/logout", {}).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.mark}>P</span>
          <span className={styles.brandName}>Personal Hub</span>
        </div>

        <nav className={styles.nav}>
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={isActive(pathname, item.href)}
              >
                <Icon width={17} height={17} />
                {item.label}
              </Link>
            );
          })}

          <div className={styles.navDivider} />

          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={isActive(pathname, item.href)}
              >
                <Icon width={17} height={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.capture} onClick={() => quickAdd.open()}>
            Quick Capture
            <span className={styles.kbd}>N</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.mobileBrand}>
            <span className={styles.mark}>P</span>
          </div>

          <div className={styles.search}>
            <SearchIcon width={16} height={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search opportunities, tasks, or notes…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value.trim();
                  router.push(
                    value ? `/opportunities?q=${encodeURIComponent(value)}` : "/opportunities",
                  );
                }
              }}
            />
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => quickAdd.open()}
            >
              <PlusIcon width={15} height={15} />
              Add
            </button>

            <button type="button" className={styles.iconBtn} aria-label="Notifications">
              <BellIcon width={16} height={16} />
            </button>

            <div className={styles.menu} ref={menuRef}>
              <button
                type="button"
                className={styles.avatar}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
              >
                {avatarLabel}
              </button>
              {menuOpen ? (
                <div className={styles.menuPopover}>
                  <div className={styles.menuEmail}>{ownerEmail}</div>
                  <Link href="/settings" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <button type="button" className={styles.menuItem} onClick={logout}>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>

        <nav className={styles.mobileNav}>
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileNavItem}
                data-active={isActive(pathname, item.href)}
              >
                <Icon width={20} height={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={styles.mobileNavItem}
            onClick={() => quickAdd.open()}
          >
            <PlusIcon width={20} height={20} />
            <span>Add</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export function AppShell({ ownerEmail, children }: { ownerEmail: string; children: ReactNode }) {
  return (
    <OwnerProvider email={ownerEmail}>
      <ToastProvider>
        <QuickAddProvider>
          <ShellChrome ownerEmail={ownerEmail}>{children}</ShellChrome>
        </QuickAddProvider>
      </ToastProvider>
    </OwnerProvider>
  );
}

'use client';

import Link from 'next/link';

export default function Logo({ size = 'text-3xl', className = '' }) {
  return (
    <Link
      href="/"
      aria-label="Skill Barter System home"
      className={`font-extrabold tracking-tight select-none ${size} ${className}`}
    >
      <span className="text-[var(--parrot)]">SB</span>
      <span className="text-gray-800 dark:text-gray-200">art</span>
    </Link>
  );
}

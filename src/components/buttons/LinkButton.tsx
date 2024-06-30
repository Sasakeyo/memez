import React, { ReactNode } from 'react';
import Link from 'next/link';

export type LinkButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

function LinkButton({ children, href, className }: LinkButtonProps) {
  return (
    <Link
      href={href}
      passHref
      rel="noreferrer"
      className={`inline-flex px-x1 py-x0.5 text-body font-medium tracking-body uppercase hover:text-shadow active:text-shadow active:text-main-light ${className}`}
    >
      [{children}]
    </Link>
  );
}

export default LinkButton;

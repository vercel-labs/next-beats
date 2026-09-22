import { Headphones, Home, Search, ShoppingBag } from 'lucide-react';
import { NavLink } from './ui/nav-link';

const mobileTab =
  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-gray hover:text-black dark:hover:text-white aria-[current=page]:text-accent aria-[current=page]:font-bold aria-[current=page]:[&_svg]:stroke-[2.5]';

export function MobileTabBar() {
  return (
    <div className="h-[calc(3.625rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden">
      <nav
        aria-label="Primary"
        style={{ viewTransitionName: 'mobile-nav' }}
        className="border-divider/70 dark:border-divider-dark/70 fixed inset-x-0 bottom-0 z-30 flex border-t bg-white pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] sm:hidden dark:bg-black"
      >
        <NavLink href="/" aria-label="Home" className={mobileTab}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        <NavLink href="/search" aria-label="Search" className={mobileTab}>
          <Search className="h-5 w-5" />
          <span>Search</span>
        </NavLink>
        <NavLink href="/podcasts" aria-label="Podcasts" className={mobileTab}>
          <Headphones className="h-5 w-5" />
          <span>Podcasts</span>
        </NavLink>
        <NavLink href="/cart" aria-label="Shopping bag" className={mobileTab}>
          <ShoppingBag className="h-5 w-5" />
          <span>Bag</span>
        </NavLink>
      </nav>
    </div>
  );
}

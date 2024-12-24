import { useState, useRef, useEffect } from "react";
import { ShoppingBag, Search } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserMenu } from "./UserMenu.js";
import { useAuth } from "../context/AuthContext.js";
import { SearchBox } from "./SearchBox.js";
import { useCart } from "../context/CartContext.js";
import { CartDropdown } from "./CartDropdown.js";
import { cn } from "../utils/cn.js";

export function Header() {
  const { isAuthenticated } = useAuth();
  const { totalItems, setIsOpen: setCartOpen, isOpen: isCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserIconClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  };

  const toggleCart = () => {
    console.log('Opening cart');
    setCartOpen(true);  // Always open the cart when clicking the icon
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  // Check if current route is a profile-related page
  const isProfilePage = ["/profile", "/orders", "/messages", "/wishlist"].includes(
    location.pathname
  );

  // Check if current route is login or register page
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  const navLinks = [
    { href: "/", label: "หน้าแรก" },
    { href: "/products", label: "สินค้าทั้งหมด" },
    { href: "/products/new", label: "สินค้าใหม่" },
    { href: "/products/sale", label: "สินค้าลดราคา" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Top Row: Logo, Search, and Controls */}
      <div className="px-4 mx-auto max-w-7xl sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-lg font-bold">
              PINPINUN SHOP
            </Link>
          </div>

          {/* Search and Controls */}
          {!isAuthPage && (
            <div className="flex items-center gap-1 sm:gap-4">
              {/* Only show search box if not on profile pages and not on auth pages */}
              {!isProfilePage && (
                <>
                  {/* Mobile Search Icon */}
                  <button
                    onClick={toggleSearch}
                    className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Mobile Search Box */}
                  {isSearchOpen && (
                    <div
                      ref={searchRef}
                      className="absolute top-0 left-0 right-0 p-4 bg-white md:hidden"
                    >
                      <div className="flex items-center gap-2">
                        <SearchBox />
                      </div>
                    </div>
                  )}

                  {/* Desktop Search Box */}
                  <div className="hidden w-32 sm:w-40 md:w-auto md:block">
                    <SearchBox />
                  </div>
                </>
              )}

              <nav className="flex items-center gap-1 sm:gap-3">
                <div className="relative">
                  <button
                    onClick={toggleCart}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-black rounded-full -top-1.5 -right-1.5">
                        {totalItems}
                      </span>
                    )}
                  </button>
                  {isCartOpen && (
                    <CartDropdown
                      isOpen={isCartOpen}
                      onClose={() => setCartOpen(false)}
                    />
                  )}
                </div>

                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <UserMenu onClick={handleUserIconClick} />
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Navigation Links - Only show if not on profile pages and not on auth pages */}
      {!isProfilePage && !isAuthPage && (
        <div className="border-t md:block relative">
          <div className="px-4 mx-auto max-w-7xl sm:px-6">
            <nav className="flex flex-row overflow-x-auto md:flex-row">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium transition-colors relative group text-center whitespace-nowrap",
                    "border-b md:border-b-0",
                    location.pathname === link.href
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 hover:text-blue-600 border-transparent"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

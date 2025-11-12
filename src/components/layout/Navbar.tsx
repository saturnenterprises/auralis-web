import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-sm">
      {/* Top contact bar */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>English</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-3 bg-white rounded"></div>
                <span>+91-9946 86 9229</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-3 bg-white rounded"></div>
                <span>+1-551-554-0052</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-700">Auralis</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative">
              <button
                className="flex items-center space-x-1 text-blue-700 hover:text-blue-500 transition-colors"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <span>Products</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isProductsOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-200 p-4"
                  onMouseEnter={() => setIsProductsOpen(true)}
                  onMouseLeave={() => setIsProductsOpen(false)}
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-blue-700">Telephony</h3>
                      <p className="text-sm text-gray-500">
                        Internet-based phone system
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-700">Cloud PBX</h3>
                      <p className="text-sm text-gray-500">
                        Advanced call management
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/byot"
              className="text-blue-700 hover:text-blue-500 transition-colors"
            >
              BYOT
            </Link>
            <Link
              to="/solutions"
              className="text-blue-700 hover:text-blue-500 transition-colors"
            >
              Solutions
            </Link>
            <Link
              to="/company"
              className="text-blue-700 hover:text-blue-500 transition-colors"
            >
              Company
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              size="sm"
            >
              Click to contact
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/signin" className="text-blue-700">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-blue-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-blue-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link to="/products" className="block py-2 text-blue-700">
              Products
            </Link>
            <Link to="/byot" className="block py-2 text-blue-700">
              BYOT
            </Link>
            <Link to="/solutions" className="block py-2 text-blue-700">
              Solutions
            </Link>
            <Link to="/company" className="block py-2 text-blue-700">
              Company
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t border-blue-200">
              <Button
                className="bg-blue-500 text-white hover:bg-blue-600"
                size="sm"
              >
                Click to contact
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signin" className="text-blue-700">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

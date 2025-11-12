import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      const fadeDistance = 200; // px to fully fade out
      const next = Math.max(0, 1 - window.scrollY / fadeDistance);
      setOpacity(next);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="w-full sticky top-0 z-50 bg-transparent pt-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="text-4xl font-sans font-extrabold text-gray-800 transition-opacity duration-00" style={{ opacity }}>
            Auralis
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
"use client"
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ForceRender = () => {
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => {
      window.scrollBy(0, 1); // Примусовий скрол (на 1 піксель вниз)
      window.scrollBy(0, -1); // Повернення назад
    }, 300);
  }, [pathname]);

  return null;
};

export default ForceRender;

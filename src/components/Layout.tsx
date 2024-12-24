import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header.js";

interface LayoutProps {
  children?: ReactNode;
  showHeader?: boolean;
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="container flex-grow px-4 mx-auto sm:px-6 lg:px-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

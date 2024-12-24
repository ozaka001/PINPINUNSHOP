import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header.js";

interface PublicLayoutProps {
  children?: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow px-4 mx-auto sm:px-6 lg:px-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};
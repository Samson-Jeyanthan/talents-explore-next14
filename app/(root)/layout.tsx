import React from "react";
import { LeftSidebar } from "@/components/widgets";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Drawer>
        <main className="flex min-h-screen w-full">
          <LeftSidebar />
          <section className="flex w-full flex-col bg-dark-200">
            <nav>Navbar</nav>
            {children}
          </section>
        </main>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>hi</DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default layout;

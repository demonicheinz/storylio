"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AnalyticsTabs({
  content,
  traffic,
}: {
  content: ReactNode;
  traffic: ReactNode;
}) {
  return (
    <Tabs defaultValue="content" className="gap-6 min-w-0">
      <TabsList aria-label="Analytics source" className="w-full sm:w-fit">
        <TabsTrigger value="content" className="min-h-11">
          Content
        </TabsTrigger>
        <TabsTrigger value="traffic" className="min-h-11">
          Web traffic
        </TabsTrigger>
      </TabsList>
      <TabsContent value="content" keepMounted>
        {content}
      </TabsContent>
      <TabsContent value="traffic" keepMounted>
        {traffic}
      </TabsContent>
    </Tabs>
  );
}

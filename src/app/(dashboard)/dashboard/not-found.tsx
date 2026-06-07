import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <MagnifyingGlassIcon className="mx-auto size-10 text-muted-foreground" />
          <CardTitle className="mt-3">CMS item not found</CardTitle>
          <CardDescription>
            The requested item may have been deleted, or the dashboard link is
            no longer valid.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon />
              Dashboard overview
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

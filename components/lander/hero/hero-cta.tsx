import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroCta() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button size="lg" className="gap-2">
        Start prototype
        <ArrowRight className="size-4" />
      </Button>
      <Button size="lg" variant="outline">
        View docs
      </Button>
    </div>
  );
}

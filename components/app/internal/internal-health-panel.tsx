import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";

export function InternalHealthPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health</CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={ROUTES.api.health}
          className="text-sm text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open {ROUTES.api.health}
        </a>
      </CardContent>
    </Card>
  );
}

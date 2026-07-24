import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export function InternalSupabasePanel() {
  const configured = isSupabaseConfigured();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Status:{" "}
          <span className={configured ? "text-foreground" : "text-muted-foreground"}>
            {configured ? "configured" : "skipped"}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

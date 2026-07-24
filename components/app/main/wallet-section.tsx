import { DynamicAuthPanel } from "@/components/dynamic/dynamic-auth-panel";
import { DynamicProvider } from "@/components/dynamic/dynamic-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * The only place on `/main` that touches the Dynamic SDK, and the reason the
 * provider is mounted here instead of in the root layout.
 */
export function WalletSection() {
  return (
    <Card size="sm" className="h-full" id="wallet">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle as="h2">Wallet</CardTitle>
          <Badge variant="outline">Base Sepolia</Badge>
        </div>
        <CardDescription>
          Connect once for escrow checkout. Funds stay until you approve work in
          Messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <DynamicProvider>
          <DynamicAuthPanel />
        </DynamicProvider>
      </CardContent>
    </Card>
  );
}

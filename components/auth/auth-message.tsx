import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthMessageProps {
  error?: string;
  success?: string;
}

export function AuthMessage({ error, success }: AuthMessageProps) {
  if (!error && !success) return null;

  return (
    <Alert variant={error ? "destructive" : "default"}>
      <AlertDescription>{error ?? success}</AlertDescription>
    </Alert>
  );
}

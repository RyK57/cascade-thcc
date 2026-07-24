"use client";

import { useState } from "react";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DynamicLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const {
    mutate: sendEmailOTP,
    data: otpVerification,
    isPending: isSending,
  } = useSendEmailOTP();
  const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP();

  if (!otpVerification) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="dynamic-email">Email</Label>
          <Input
            id="dynamic-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button
          disabled={!email || isSending}
          onClick={() => sendEmailOTP({ email })}
        >
          {isSending ? "Sending…" : "Send code"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="dynamic-otp">Verification code</Label>
        <Input
          id="dynamic-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>
      <Button
        disabled={code.length < 6 || isVerifying}
        onClick={() =>
          verifyOTP({ otpVerification, verificationToken: code })
        }
      >
        {isVerifying ? "Verifying…" : "Verify"}
      </Button>
    </div>
  );
}

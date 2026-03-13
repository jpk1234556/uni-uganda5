import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Supabase handles the actual token exchange in the background automatically if the URL has ?code=...
    // We just need to check if we have a session after a short delay
    const checkVerification = async () => {
      try {
        const error_description = searchParams.get("error_description");
        if (error_description) {
          throw new Error(error_description);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setStatus("success");
          // Redirect after 3 seconds
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
           // If we don't have a session immediately, wait a bit for supabase client state to update
           setTimeout(async () => {
              const { data } = await supabase.auth.getSession();
              if (data.session) {
                  setStatus("success");
                  setTimeout(() => navigate("/"), 3000);
              } else {
                  throw new Error("Verification link expired or invalid.");
              }
           }, 1500);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to verify email.");
      }
    };

    checkVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>We are verifying your account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
          
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Please wait while we confirm your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center font-medium">Your email has been successfully verified!</p>
              <p className="text-sm text-muted-foreground text-center">Redirecting you to the homepage...</p>
              <Button onClick={() => navigate("/")} className="w-full mt-4">Go to Homepage</Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center font-medium text-destructive">Verification Failed</p>
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
              <Button onClick={() => navigate("/auth")} variant="outline" className="w-full mt-4">Back to Login</Button>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

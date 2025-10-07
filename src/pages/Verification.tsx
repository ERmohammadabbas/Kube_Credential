import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, FileJson, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Verification = () => {
  const [credentialJson, setCredentialJson] = useState(JSON.stringify({ id: "CRED-1000" }, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!credentialJson.trim()) {
      toast.error("Please enter credential JSON");
      return;
    }

    try {
      const parsed = JSON.parse(credentialJson);
      setIsLoading(true);
      setResult(null);

  // Use local verification backend port (update to the port your verification service is running on)
  const response = await fetch("http://localhost:3002/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      setResult({ success: response.ok, data });

      if (response.ok && data.status === "valid") {
        toast.success("Credential verified successfully!");
      } else {
        toast.error(data.message || "Credential not found");
      }
    } catch (error: any) {
      setResult({ success: false, data: { message: error.message } });
      toast.error("Invalid JSON or request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <FileJson className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">
                Kube Credential
              </span>
            </Link>
            <div className="flex gap-4">
              <Link to="/issuance">
                <Button variant="outline">Issuance</Button>
              </Link>
              <Link to="/verification">
                <Button variant="default">Verification</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Credential Verification
          </h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity of issued credentials
          </p>
        </div>

        <Card className="p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Credential JSON
              </label>
              <Textarea
                placeholder='{"id": "12345", "name": "John Doe", "role": "Developer"}'
                value={credentialJson}
                onChange={(e) => setCredentialJson(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the credential JSON to verify its authenticity
              </p>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Credential
                </>
              )}
            </Button>

            {result && (
              <Card
                className={`p-6 ${
                  result.success && result.data.status === "valid"
                    ? "bg-success/10 border-success/50"
                    : "bg-destructive/10 border-destructive/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success && result.data.status === "valid" ? (
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-2 ${
                        result.success && result.data.status === "valid"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {result.success && result.data.status === "valid"
                        ? "Credential Valid"
                        : "Verification Failed"}
                    </h3>
                    <pre className="text-sm bg-background/50 p-4 rounded-md overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-muted/50 border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              Valid Response
            </h3>
            <pre className="text-xs bg-background p-4 rounded-md overflow-auto font-mono">
              {JSON.stringify(
                {
                  status: "valid",
                  worker: "worker-1",
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </Card>

          <Card className="p-6 bg-muted/50 border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Invalid Response
            </h3>
            <pre className="text-xs bg-background p-4 rounded-md overflow-auto font-mono">
              {JSON.stringify(
                {
                  status: "invalid",
                  message: "Credential not found",
                },
                null,
                2
              )}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Verification;

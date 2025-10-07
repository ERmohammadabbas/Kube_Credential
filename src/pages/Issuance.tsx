import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, FileJson } from "lucide-react";
import { Link } from "react-router-dom";

const Issuance = () => {
  const [credentialJson, setCredentialJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleIssue = async () => {
    if (!credentialJson.trim()) {
      toast.error("Please enter credential JSON");
      return;
    }

    try {
      const parsed = JSON.parse(credentialJson);
      setIsLoading(true);
      setResult(null);

  // Use local issuance backend port
  const response = await fetch("http://localhost:3004/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      setResult({ success: response.ok, data });

      if (response.ok) {
        toast.success("Credential issued successfully!");
      } else {
        toast.error(data.message || "Failed to issue credential");
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
                <Button variant="default">Issuance</Button>
              </Link>
              <Link to="/verification">
                <Button variant="outline">Verification</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Credential Issuance
          </h1>
          <p className="text-muted-foreground text-lg">
            Issue new credentials to the blockchain
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
                Enter a valid JSON object representing the credential
              </p>
            </div>

            <Button
              onClick={handleIssue}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                "Issue Credential"
              )}
            </Button>

            {result && (
              <Card
                className={`p-6 ${
                  result.success
                    ? "bg-success/10 border-success/50"
                    : "bg-destructive/10 border-destructive/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-2 ${
                        result.success ? "text-success" : "text-destructive"
                      }`}
                    >
                      {result.success ? "Success" : "Error"}
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

        <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            Example Credential
          </h3>
          <pre className="text-xs bg-background p-4 rounded-md overflow-auto font-mono">
            {JSON.stringify(
              {
                id: "CRED-12345",
                name: "John Doe",
                role: "Senior Developer",
                department: "Engineering",
                issueDate: new Date().toISOString(),
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Issuance;

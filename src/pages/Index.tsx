import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileJson, Shield, CheckCircle, Server, Blocks } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
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
                <Button variant="outline">Verification</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 inline-block">
            <div className="p-4 rounded-2xl bg-primary shadow-glow">
              <Blocks className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary">
            Kube Credential System
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            A microservice-based credential management system built with Node.js, Docker, and Kubernetes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/issuance">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-card-hover">
                <FileJson className="mr-2 h-5 w-5" />
                Issue Credential
              </Button>
            </Link>
            <Link to="/verification">
              <Button size="lg" variant="outline" className="border-2">
                <Shield className="mr-2 h-5 w-5" />
                Verify Credential
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50">
            <div className="mb-4 inline-block p-3 rounded-xl bg-primary/10">
              <FileJson className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Issuance Service</h3>
            <p className="text-muted-foreground">
              Issue new credentials with unique identifiers and persist them securely
            </p>
          </Card>

          <Card className="p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50">
            <div className="mb-4 inline-block p-3 rounded-xl bg-success/10">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verification Service</h3>
            <p className="text-muted-foreground">
              Verify credential authenticity and retrieve issuance metadata
            </p>
          </Card>

          <Card className="p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50">
            <div className="mb-4 inline-block p-3 rounded-xl bg-accent/10">
              <Server className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Microservices</h3>
            <p className="text-muted-foreground">
              Independent services deployed with Docker and orchestrated by Kubernetes
            </p>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: CheckCircle, text: "RESTful API with TypeScript" },
              { icon: CheckCircle, text: "Docker containerization" },
              { icon: CheckCircle, text: "Kubernetes deployment" },
              { icon: CheckCircle, text: "SQLite persistence" },
              { icon: CheckCircle, text: "Winston logging" },
              { icon: CheckCircle, text: "Swagger documentation" },
              { icon: CheckCircle, text: "JWT authentication" },
              { icon: CheckCircle, text: "Rate limiting" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <feature.icon className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Built for Zupple Labs Assignment - Microservices Architecture</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

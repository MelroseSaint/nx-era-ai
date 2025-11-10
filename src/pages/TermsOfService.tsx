"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-3xl font-bold laser-text">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">
              Welcome to <strong>NXE AI</strong>. By using our platform, you agree to the following terms. Please
              review them carefully.
            </p>
            <h3 className="text-xl font-semibold">1. Use of the Service</h3>
            <p className="leading-relaxed">
              You may use NXE AI to generate, preview, and download application code. You are responsible for
              ensuring any generated code complies with your applicable laws and licensing requirements.
            </p>
            <h3 className="text-xl font-semibold">2. Data and Privacy</h3>
            <p>
              We may store prompts, generated code, and related metadata to improve the service and provide features
              like project history. Do not submit sensitive personal data.
            </p>
            <h3 className="text-xl font-semibold">3. Ownership</h3>
            <p>
              You own the prompts you provide and the resulting generated outputs, subject to any third-party
              dependencies used within the generated code.
            </p>
            <h3 className="text-xl font-semibold">4. Limitations</h3>
            <p className="leading-relaxed">
              Generated code may require additional setup and may not be production-ready. NXE AI is provided “as is”
              without warranties of any kind.
            </p>
            <h3 className="text-xl font-semibold">5. Contact</h3>
            <p>
              For questions about these terms, contact us via the link in the footer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;

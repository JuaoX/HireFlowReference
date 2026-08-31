import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShareJobRequest {
  jobId: string;
  jobTitle: string;
  jobUrl: string;
  recipientEmail: string;
  recipientName?: string;
  senderMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get sender profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const senderName = profile?.full_name || "A colleague";

    // Parse request body
    const {
      jobId,
      jobTitle,
      jobUrl,
      recipientEmail,
      recipientName,
      senderMessage,
    }: ShareJobRequest = await req.json();

    console.log("Sharing job:", { jobId, jobTitle, recipientEmail });

    // Fetch full job details
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("title, location, employment_type, description_md")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Format employment type
    const employmentTypeMap: Record<string, string> = {
      full_time: "Full Time",
      part_time: "Part Time",
      contract: "Contract",
      internship: "Internship",
    };

    const formattedEmploymentType =
      employmentTypeMap[job.employment_type] || job.employment_type;

    // Prepare email content
    const recipientGreeting = recipientName
      ? `Hi ${recipientName},`
      : "Hi there,";
    
    const personalMessage = senderMessage
      ? `<p style="margin: 16px 0; color: #374151; line-height: 1.6;">${senderMessage}</p>`
      : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="margin-bottom: 32px;">
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111827;">Job Opportunity Shared With You</h1>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${senderName} thought you might be interested in this position</p>
              </div>

              <!-- Personal Message -->
              ${personalMessage}

              <!-- Job Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">${job.title}</h2>
                
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                  ${job.location ? `<span style="display: inline-block; padding: 6px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 16px; font-size: 12px; font-weight: 500;">📍 ${job.location}</span>` : ""}
                  <span style="display: inline-block; padding: 6px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 16px; font-size: 12px; font-weight: 500;">💼 ${formattedEmploymentType}</span>
                </div>

                ${job.description_md ? `<p style="margin: 16px 0 0 0; color: #4b5563; line-height: 1.6; font-size: 14px;">${job.description_md.substring(0, 200)}${job.description_md.length > 200 ? "..." : ""}</p>` : ""}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${jobUrl}" style="display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Job Posting</a>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  You received this email because ${senderName} shared a job opportunity with you.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Job Opportunities <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${senderName} shared a job with you: ${job.title}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in share-job function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

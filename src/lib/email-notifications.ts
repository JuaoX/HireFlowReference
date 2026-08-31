import { supabase } from '@/integrations/supabase/client';

interface EmailParams {
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
  candidateId?: string;
  applicationId?: string;
}

async function queueEmail(params: EmailParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Create message record
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      org_id: profile.org_id,
      application_id: params.applicationId || null,
      candidate_id: params.candidateId || null,
      sender_user_id: user.id,
      to_addresses: params.to,
      cc_addresses: params.cc || [],
      subject: params.subject,
      body_html: params.bodyHtml,
      status: 'queued',
    })
    .select()
    .single();

  if (messageError) throw messageError;

  // Trigger edge function to send email
  const { error: functionError } = await supabase.functions.invoke('send-email', {
    body: { messageId: message.id },
  });

  if (functionError) {
    console.error('Error invoking send-email function:', functionError);
    throw functionError;
  }

  return message;
}

export async function sendApplicationConfirmation(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  applicationId: string,
  candidateId: string
) {
  const subject = `Application Received - ${jobTitle}`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your Application!</h2>
      <p>Dear ${candidateName},</p>
      <p>We have received your application for the <strong>${jobTitle}</strong> position.</p>
      <p>Our team will review your application and get back to you shortly. If your qualifications match our requirements, we'll reach out to schedule the next steps.</p>
      <p>Thank you for your interest in joining our team!</p>
      <br>
      <p style="color: #666; font-size: 14px;">Best regards,<br>The Hiring Team</p>
    </div>
  `;

  return queueEmail({
    to: [candidateEmail],
    subject,
    bodyHtml,
    candidateId,
    applicationId,
  });
}

export async function sendInterviewInvitation(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  interviewDate: string,
  interviewTime: string,
  meetingLink?: string,
  location?: string,
  applicationId?: string,
  candidateId?: string
) {
  const subject = `Interview Invitation - ${jobTitle}`;
  const locationInfo = meetingLink 
    ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
    : location 
    ? `<p><strong>Location:</strong> ${location}</p>`
    : '';

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Interview Invitation</h2>
      <p>Dear ${candidateName},</p>
      <p>We're pleased to invite you to an interview for the <strong>${jobTitle}</strong> position.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> ${interviewDate}</p>
        <p><strong>Time:</strong> ${interviewTime}</p>
        ${locationInfo}
      </div>
      <p>Please confirm your attendance by replying to this email.</p>
      <p>We look forward to speaking with you!</p>
      <br>
      <p style="color: #666; font-size: 14px;">Best regards,<br>The Hiring Team</p>
    </div>
  `;

  return queueEmail({
    to: [candidateEmail],
    subject,
    bodyHtml,
    candidateId,
    applicationId,
  });
}

export async function sendOfferNotification(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  baseAmount: number,
  currency: string,
  expiresAt?: string,
  applicationId?: string,
  candidateId?: string
) {
  const subject = `Job Offer - ${jobTitle}`;
  const expirationInfo = expiresAt 
    ? `<p><strong>This offer expires on:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>`
    : '';

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Congratulations! You've Received a Job Offer</h2>
      <p>Dear ${candidateName},</p>
      <p>We are delighted to offer you the position of <strong>${jobTitle}</strong>.</p>
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <p><strong>Base Salary:</strong> ${currency} ${baseAmount.toLocaleString()}</p>
        ${expirationInfo}
      </div>
      <p>Please review the complete offer details that have been sent separately. If you have any questions, don't hesitate to reach out.</p>
      <p>We're excited about the possibility of you joining our team!</p>
      <br>
      <p style="color: #666; font-size: 14px;">Best regards,<br>The Hiring Team</p>
    </div>
  `;

  return queueEmail({
    to: [candidateEmail],
    subject,
    bodyHtml,
    candidateId,
    applicationId,
  });
}

export async function sendRejectionNotification(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  applicationId?: string,
  candidateId?: string
) {
  const subject = `Update on Your Application - ${jobTitle}`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Application Update</h2>
      <p>Dear ${candidateName},</p>
      <p>Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to interview with us.</p>
      <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.</p>
      <p>We appreciate the time and effort you invested in the application process. We encourage you to apply for future openings that match your skills and experience.</p>
      <p>We wish you the best in your job search and future endeavors.</p>
      <br>
      <p style="color: #666; font-size: 14px;">Best regards,<br>The Hiring Team</p>
    </div>
  `;

  return queueEmail({
    to: [candidateEmail],
    subject,
    bodyHtml,
    candidateId,
    applicationId,
  });
}

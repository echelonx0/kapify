
// backend/src/config/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  to: string;
  from: {
    email: string;
    name: string;
  };
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private readonly fromEmail = process.env.SENDGRID_FROM_EMAIL!;
  private readonly fromName = process.env.SENDGRID_FROM_NAME!;

  async sendEmail(template: EmailTemplate) {
    try {
      const msg = {
        ...template,
        from: {
          email: this.fromEmail,
          name: this.fromName
        }
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${template.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    await this.sendEmail({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Welcome to Kapify Platform',
      html: `
        <h1>Welcome to Kapify, ${firstName}!</h1>
        <p>Thank you for joining our SME funding platform.</p>
        <p>You can now access your dashboard and start building your investment profile.</p>
        <a href="${process.env.FRONTEND_URL}/profile/steps" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Profile</a>
      `,
      text: `Welcome to Kapify, ${firstName}! Thank you for joining our SME funding platform.`
    });
  }

  async sendProfileCompletionReminder(to: string, firstName: string, completionPercentage: number) {
    await this.sendEmail({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Complete Your Investment Profile',
      html: `
        <h1>Complete Your Profile, ${firstName}</h1>
        <p>Your profile is ${completionPercentage}% complete. Finish it to access funding opportunities.</p>
        <a href="${process.env.FRONTEND_URL}/profile/steps">Continue Profile Setup</a>
      `,
      text: `Your profile is ${completionPercentage}% complete. Continue at ${process.env.FRONTEND_URL}/profile/steps`
    });
  }

  async sendApplicationStatusUpdate(to: string, firstName: string, applicationTitle: string, status: string) {
    await this.sendEmail({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: `Application Update: ${applicationTitle}`,
      html: `
        <h1>Application Status Update</h1>
        <p>Hi ${firstName},</p>
        <p>Your application "${applicationTitle}" status has been updated to: <strong>${status}</strong></p>
        <a href="${process.env.FRONTEND_URL}/applications">View Application</a>
      `,
      text: `Your application "${applicationTitle}" status: ${status}`
    });
  }
}

export const emailService = new EmailService();

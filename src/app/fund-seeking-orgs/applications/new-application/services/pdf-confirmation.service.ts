import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

export interface ConfirmationData {
  applicationId: string;
  applicationTitle: string;
  submittedDate: Date;

  requestedAmount: number;
  currency: string;
  opportunityName?: string;
  funderName?: string;
  funderEmail?: string;
  applicantName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PDFConfirmationService {
  private readonly KAPIFY_TEAL = '#14b8a6';
  private readonly KAPIFY_SLATE_900 = '#0f172a';
  private readonly KAPIFY_SLATE_600 = '#475569';
  private readonly KAPIFY_SLATE_50 = '#f8fafc';
  private readonly KAPIFY_GREEN = '#16a34a';

  async generateConfirmationPDF(data: ConfirmationData): Promise<Blob> {
    // Generate QR code as data URL
    const qrCodeDataUrl = await this.generateQRCode(
      'https://www.kapify.africa'
    );

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Set default font
    pdf.setFont('Helvetica');

    // ===============================
    // HEADER SECTION (Top)
    // ===============================
    this.drawHeader(pdf, pageWidth);

    // ===============================
    // SUCCESS BADGE & TITLE
    // ===============================
    let yPosition = 50;
    this.drawSuccessBadge(pdf, pageWidth, yPosition);

    yPosition += 18;
    pdf.setFontSize(24);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
    pdf.text('Application Submitted', pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 12;
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_600));
    const subtitle = `Your application has been successfully submitted and is under review.`;
    pdf.text(subtitle, pageWidth / 2, yPosition, {
      align: 'center',
      maxWidth: pageWidth - 40,
    });

    // ===============================
    // APPLICATION SUMMARY SECTION
    // ===============================
    yPosition += 20;
    this.drawApplicationSummary(pdf, pageWidth, yPosition, data);

    // ===============================
    // NEXT STEPS SECTION
    // ===============================
    yPosition += 75;
    this.drawNextSteps(pdf, pageWidth, yPosition, data);

    // ===============================
    // QR CODE (Bottom Right)
    // ===============================
    const qrSize = 30; // mm
    const qrX = pageWidth - qrSize - 12; // 12mm from right edge
    const qrY = pageHeight - qrSize - 12; // 12mm from bottom edge

    // Add subtle background for QR code
    pdf.setFillColor(...this.hexToRgb(this.KAPIFY_SLATE_50));
    pdf.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 'F');

    // Add QR code border
    pdf.setDrawColor(...this.hexToRgb(this.KAPIFY_TEAL));
    pdf.setLineWidth(0.5);
    pdf.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);

    // Add QR code image
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Add small label above QR code
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_600));
    pdf.text('Visit Kapify', qrX + qrSize / 2, qrY - 6, { align: 'center' });

    // ===============================
    // FOOTER
    // ===============================
    this.drawFooter(pdf, pageWidth, pageHeight);

    return pdf.output('blob');
  }

  private drawHeader(pdf: jsPDF, pageWidth: number): void {
    // Background header
    pdf.setFillColor(...this.hexToRgb(this.KAPIFY_TEAL));
    pdf.rect(0, 0, pageWidth, 35, 'F');

    // Kapify logo/brand text
    pdf.setFontSize(20);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('KAPIFY', 15, 18);

    // Subtitle
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.text('Powered by Bokamoso Advisory Services', 15, 26);

    // Decorative line
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.3);
    pdf.line(15, 31, pageWidth - 15, 31);
  }

  private drawSuccessBadge(
    pdf: jsPDF,
    pageWidth: number,
    yPosition: number
  ): void {
    // Success circle background
    pdf.setFillColor(...this.hexToRgb(this.KAPIFY_GREEN));
    pdf.circle(pageWidth / 2, yPosition + 4, 6, 'F');

    // Checkmark (using simple text)
    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('✓', pageWidth / 2, yPosition + 6, { align: 'center' });
  }

  private drawApplicationSummary(
    pdf: jsPDF,
    pageWidth: number,
    yPosition: number,
    data: ConfirmationData
  ): void {
    const leftMargin = 15;
    const rightMargin = 15;
    const boxWidth = pageWidth - leftMargin - rightMargin;

    // Card background (subtle)
    pdf.setFillColor(...this.hexToRgb(this.KAPIFY_SLATE_50));
    pdf.rect(leftMargin, yPosition, boxWidth, 60, 'F');

    // Card border
    pdf.setDrawColor(...this.hexToRgb('#e2e8f0'));
    pdf.setLineWidth(0.5);
    pdf.rect(leftMargin, yPosition, boxWidth, 60);

    let currentY = yPosition + 8;

    // Row 1: Application ID & Status
    this.drawSummaryRow(
      pdf,
      leftMargin + 8,
      currentY,
      'APPLICATION ID',
      `#${data.applicationId}`,
      pageWidth / 2
    );

    this.drawSummaryRow(
      pdf,
      pageWidth / 2 + 2,
      currentY,
      'STATUS',
      'submitted',
      pageWidth - rightMargin - 8,
      this.KAPIFY_GREEN
    );

    currentY += 16;

    // Row 2: Title
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
    pdf.text('APPLICATION TITLE', leftMargin + 8, currentY);

    currentY += 4;
    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
    const titleWrapped = pdf.splitTextToSize(
      data.applicationTitle,
      boxWidth - 16
    );
    pdf.text(titleWrapped, leftMargin + 8, currentY);

    currentY += 8;

    // Row 3: Amount & Date
    this.drawSummaryRow(
      pdf,
      leftMargin + 8,
      currentY,
      'AMOUNT REQUESTED',
      this.formatCurrency(data.requestedAmount, data.currency),
      pageWidth / 2
    );

    this.drawSummaryRow(
      pdf,
      pageWidth / 2 + 2,
      currentY,
      'SUBMITTED',
      this.formatDate(data.submittedDate),
      pageWidth - rightMargin - 8
    );
  }

  private drawSummaryRow(
    pdf: jsPDF,
    x: number,
    y: number,
    label: string,
    value: string,
    maxWidth: number,
    valueColor: string = this.KAPIFY_SLATE_900
  ): void {
    // Label
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(...this.hexToRgb('#94a3b8'));
    pdf.text(label, x, y);

    // Value
    y += 4;
    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(valueColor));
    const wrapped = pdf.splitTextToSize(value, maxWidth - x);
    pdf.text(wrapped, x, y);
  }

  private drawNextSteps(
    pdf: jsPDF,
    pageWidth: number,
    yPosition: number,
    data: ConfirmationData
  ): void {
    const leftMargin = 15;
    const rightMargin = 15;

    // Section title
    pdf.setFontSize(12);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
    pdf.text('NEXT STEPS', leftMargin, yPosition);

    yPosition += 10;

    const steps = [
      {
        title: 'Monitor Your Email',
        description:
          'The funder will contact you directly with updates and any requests for additional information.',
      },
      {
        title: 'Keep Information Updated',
        description:
          'Ensure your contact details remain current in your Kapify profile.',
      },
      {
        title: 'Track Progress',
        description:
          'Log into your dashboard anytime to view the status of your application.',
      },
    ];

    steps.forEach((step, index) => {
      // Step number circle
      pdf.setFillColor(...this.hexToRgb(this.KAPIFY_TEAL));
      pdf.circle(leftMargin + 3, yPosition + 3, 2.5, 'F');

      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text((index + 1).toString(), leftMargin + 3, yPosition + 4, {
        align: 'center',
      });

      // Step title
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
      pdf.text(step.title, leftMargin + 10, yPosition + 2);

      // Step description
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_600));
      const descWrapped = pdf.splitTextToSize(
        step.description,
        pageWidth - leftMargin - rightMargin - 10
      );
      pdf.text(descWrapped, leftMargin + 10, yPosition + 6);

      yPosition += descWrapped.length * 4 + 6;
    });

    // Contact section
    yPosition += 4;

    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_900));
    pdf.text('Need Help?', leftMargin, yPosition);

    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_600));
    let contactText = 'Contact Kapify Support: support@kapify.africa';

    if (data.funderEmail) {
      contactText += ` | Funder: ${data.funderEmail}`;
    }

    const contactWrapped = pdf.splitTextToSize(
      contactText,
      pageWidth - leftMargin - rightMargin - 40
    );
    pdf.text(contactWrapped, leftMargin, yPosition);
  }

  private drawFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    // Footer line
    pdf.setDrawColor(...this.hexToRgb('#e2e8f0'));
    pdf.setLineWidth(0.3);
    pdf.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

    // Footer text
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(...this.hexToRgb(this.KAPIFY_SLATE_600));
    pdf.text(
      'Kapify Africa | Connecting SMEs with Funding Opportunities',
      pageWidth / 2,
      pageHeight - 14,
      { align: 'center' }
    );

    pdf.text('www.kapify.africa', pageWidth / 2, pageHeight - 8, {
      align: 'center',
    });

    // Timestamp
    pdf.setFontSize(7);
    pdf.setTextColor(...this.hexToRgb('#cbd5e1'));
    pdf.text(
      `Generated: ${new Date().toLocaleString('en-ZA')}`,
      15,
      pageHeight - 4
    );
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        width: 300,
        color: {
          dark: this.KAPIFY_TEAL,
          light: '#ffffff',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }

  downloadPDF(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

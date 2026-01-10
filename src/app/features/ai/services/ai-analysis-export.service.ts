import { Injectable } from '@angular/core';
import { DocumentAnalysisResult } from './funder-document-analysis.service';

/**
 * Analysis Report Export Service - Professional Edition
 * World Bank-grade PDF generation with:
 * - Teal/Slate color palette (design system compliant)
 * - Justified text alignment
 * - Optimized font sizes (1-2pt smaller)
 * - Professional header/footer on every page
 * - Proper page break handling
 * - Multi-page optimization
 */
@Injectable({
  providedIn: 'root',
})
export class AnalysisReportExportService {
  // Design system colors (RGB)
  private readonly COLORS = {
    teal500: [20, 184, 166],
    teal600: [13, 148, 136],
    teal700: [15, 118, 110],
    slate50: [248, 250, 252],
    slate100: [241, 245, 249],
    slate200: [226, 232, 240],
    slate500: [100, 116, 139],
    slate600: [71, 85, 105],
    slate700: [51, 65, 85],
    slate900: [15, 23, 42],
  };

  /**
   * Export analysis to professional PDF
   */
  async exportToPDF(
    analysis: DocumentAnalysisResult,
    fileName?: string
  ): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // PAGE 0: ELEGANT COVER PAGE
      this.addCoverPage(doc, pageHeight, pageWidth, margin, contentWidth);

      // PAGE 1: HEADER + EXECUTIVE SUMMARY
      doc.addPage();
      this.addPageHeader(doc, pageWidth, margin, 1);
      let yPosition = 28; // Start below header
      yPosition = this.addExecutiveSummary(
        doc,
        analysis,
        yPosition,
        contentWidth,
        margin,
        pageHeight
      );

      // KEY INSIGHTS PAGES
      if (analysis.keyInsights && analysis.keyInsights.length > 0) {
        analysis.keyInsights.forEach((insight, index) => {
          doc.addPage();
          this.addPageHeader(
            doc,
            pageWidth,
            margin,
            doc.internal.pages.length - 1
          );
          yPosition = 28;

          yPosition = this.addInsightSection(
            doc,
            insight,
            index + 1,
            yPosition,
            contentWidth,
            margin,
            pageHeight
          );
        });
      }

      // RISK ASSESSMENT PAGE
      if (analysis.riskFactors && analysis.riskFactors.length > 0) {
        doc.addPage();
        this.addPageHeader(
          doc,
          pageWidth,
          margin,
          doc.internal.pages.length - 1
        );
        yPosition = 28;

        yPosition = this.addRiskAssessmentSection(
          doc,
          analysis.riskFactors,
          yPosition,
          contentWidth,
          margin,
          pageHeight
        );
      }

      // SOURCES & REFERENCES PAGE
      if (analysis.sources && analysis.sources.length > 0) {
        doc.addPage();
        this.addPageHeader(
          doc,
          pageWidth,
          margin,
          doc.internal.pages.length - 1
        );
        yPosition = 28;

        this.addSourcesSection(
          doc,
          analysis.sources,
          yPosition,
          contentWidth,
          margin,
          pageHeight
        );
      }

      // ADD PAGE NUMBERS AND FOOTERS
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        this.addPageFooter(doc, i, pageCount, pageHeight, margin, pageWidth);
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFileName = fileName || `Investment_Analysis_${timestamp}.pdf`;

      doc.save(finalFileName);
      console.log(`✅ [PDF] Professional report exported: ${finalFileName}`);
    } catch (error) {
      console.error('❌ [PDF] Export failed:', error);
      throw error;
    }
  }

  // =====================================
  // COVER PAGE
  // =====================================

  /**
   * Elegant cover page with title, subtitle, and compliance disclosure
   */
  private addCoverPage(
    doc: any,
    pageHeight: number,
    pageWidth: number,
    margin: number,
    contentWidth: number
  ): void {
    // Gradient background (top section - teal)
    doc.setFillColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.rect(0, 0, pageWidth, pageHeight * 0.35, 'F');

    // Accent line (halfway through gradient)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(
      margin,
      pageHeight * 0.35 - 2,
      pageWidth - margin,
      pageHeight * 0.35 - 2
    );

    // MAIN TITLE (centered, on teal background)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('Investment Analysis Report', pageWidth / 2, pageHeight * 0.15, {
      align: 'center',
    });

    // Subtitle
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(
      'Comprehensive Financial & Market Assessment',
      pageWidth / 2,
      pageHeight * 0.22,
      { align: 'center' }
    );

    // KAPIFY BRANDING (centered, upper middle)
    const logoY = pageHeight * 0.42;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.text('KAPIFY', pageWidth / 2, logoY, { align: 'center' });

    // Powered by text
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.slate600[0],
      this.COLORS.slate600[1],
      this.COLORS.slate600[2]
    );
    doc.text('Powered by Bokamoso Advisory', pageWidth / 2, logoY + 6, {
      align: 'center',
    });

    // Decorative line
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 30, logoY + 10, pageWidth / 2 + 30, logoY + 10);

    // COMPLIANCE & DATA GOVERNANCE SECTION (bottom of page)
    const complianceY = pageHeight - 65;

    // Background box for compliance text
    doc.setFillColor(
      this.COLORS.slate50[0],
      this.COLORS.slate50[1],
      this.COLORS.slate50[2]
    );
    doc.rect(margin, complianceY - 2, contentWidth, 60, 'F');

    // Border
    doc.setDrawColor(
      this.COLORS.slate200[0],
      this.COLORS.slate200[1],
      this.COLORS.slate200[2]
    );
    doc.setLineWidth(0.5);
    doc.rect(margin, complianceY - 2, contentWidth, 60);

    // Compliance title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.text(
      'Data Governance & Regulatory Compliance',
      margin + 3,
      complianceY + 2
    );

    // Main compliance text
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(
      this.COLORS.slate700[0],
      this.COLORS.slate700[1],
      this.COLORS.slate700[2]
    );

    const complianceText =
      'Kapify is committed to maintaining the highest standards of data integrity, security, and regulatory compliance in accordance with the Protection of Personal Information Act (POPIA), the General Data Protection Regulation (GDPR), the Financial Intelligence Centre Act (FICA), and all applicable South African financial services regulations including the National Credit Act (NCA), the Companies Act, and SARS compliance requirements. All personal and financial information is encrypted using industry-standard protocols, subject to comprehensive audit trails, and protected under our rigorous information governance framework.';

    const complianceLines = doc.splitTextToSize(
      complianceText,
      contentWidth - 6
    );
    doc.text(complianceLines, margin + 3, complianceY + 7);

    // Contact footer
    const contactY = complianceY + 30;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(
      this.COLORS.slate600[0],
      this.COLORS.slate600[1],
      this.COLORS.slate600[2]
    );
    doc.text(
      'For inquiries regarding our data security policy, compliance procedures, or privacy practices, please contact ',
      margin + 3,
      contactY
    );

    // Email link (in teal)
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.setFont('Helvetica', 'bold');
    doc.text('data.governance@kapify.africa', margin + 3, contactY + 3.5);

    // FOOTER: Copyright and date
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(
      this.COLORS.slate600[0],
      this.COLORS.slate600[1],
      this.COLORS.slate600[2]
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );

    doc.setFontSize(6.5);
    doc.setTextColor(
      this.COLORS.slate500[0],
      this.COLORS.slate500[1],
      this.COLORS.slate500[2]
    );
    doc.text(
      '© 2025 Kapify Africa. All rights reserved.',
      pageWidth / 2,
      pageHeight - 2,
      { align: 'center' }
    );
  }

  // =====================================
  // PAGE HEADER & FOOTER
  // =====================================

  /**
   * Add header to every page (logo area, title, disclaimer)
   */
  private addPageHeader(
    doc: any,
    pageWidth: number,
    margin: number,
    pageNumber: number
  ): void {
    // Top disclaimer bar
    doc.setFillColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Disclaimer text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(
      'Generated by Kapify Africa | Powered by Bokamoso Advisory',
      margin,
      3.5
    );

    // Teal accent line
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.8);
    doc.line(margin, 7, pageWidth - margin, 7);

    // Secondary disclaimer (page 1 only)
    if (pageNumber === 1) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(
        this.COLORS.slate600[0],
        this.COLORS.slate600[1],
        this.COLORS.slate600[2]
      );
      doc.text(
        'This analysis does not constitute professional advice. Review our Terms & Conditions and Data Governance at www.kapify.africa',
        margin,
        11.5
      );
    }
  }

  /**
   * Add footer to every page (page number, disclaimer)
   */
  private addPageFooter(
    doc: any,
    pageNumber: number,
    totalPages: number,
    pageHeight: number,
    margin: number,
    pageWidth: number
  ): void {
    // Bottom line
    doc.setDrawColor(
      this.COLORS.slate200[0],
      this.COLORS.slate200[1],
      this.COLORS.slate200[2]
    );
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    // Page number (right aligned)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(
      this.COLORS.slate600[0],
      this.COLORS.slate600[1],
      this.COLORS.slate600[2]
    );
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 4
    );

    // Copyright (left aligned)
    doc.setFontSize(7);
    doc.text(
      '© 2025 Kapify Africa. All rights reserved.',
      margin,
      pageHeight - 4
    );
  }

  // =====================================
  // SECTION: EXECUTIVE SUMMARY
  // =====================================

  /**
   * Executive summary section (page 1)
   */
  private addExecutiveSummary(
    doc: any,
    analysis: DocumentAnalysisResult,
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.text('Investment Analysis Report', margin, yPosition);
    yPosition += 8;

    // Key Metrics (2x2 grid)
    yPosition = this.addKeyMetricsGrid(
      doc,
      analysis,
      yPosition,
      contentWidth,
      margin
    );
    yPosition += 6;

    // Strengths Section
    yPosition = this.addBulletSection(
      doc,
      'Key Strengths',
      analysis.strengths,
      yPosition,
      contentWidth,
      margin,
      pageHeight
    );
    yPosition += 4;

    // Improvement Areas Section
    yPosition = this.addBulletSection(
      doc,
      'Improvement Areas',
      analysis.improvementAreas,
      yPosition,
      contentWidth,
      margin,
      pageHeight
    );

    return yPosition;
  }

  /**
   * Key metrics grid (2 columns x 2 rows)
   */
  private addKeyMetricsGrid(
    doc: any,
    analysis: DocumentAnalysisResult,
    yPosition: number,
    contentWidth: number,
    margin: number
  ): number {
    const colWidth = contentWidth / 2;
    const rowHeight = 18;

    const metrics = [
      {
        label: 'Investability Score',
        value: `${analysis.matchScore}%`,
        bgColor: this.COLORS.teal500,
      },
      {
        label: 'Success Probability',
        value: `${analysis.successProbability}%`,
        bgColor: this.COLORS.teal600,
      },
      {
        label: 'Market Timing',
        value: analysis.marketTimingInsight,
        bgColor: this.COLORS.teal700,
      },
      {
        label: 'Competitive Position',
        value: analysis.competitivePositioning,
        bgColor: this.COLORS.teal500,
      },
    ];

    // Draw 2x2 grid
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = margin + col * colWidth;
      const y = yPosition + row * rowHeight;

      // Background
      doc.setFillColor(metric.bgColor[0], metric.bgColor[1], metric.bgColor[2]);
      doc.rect(x, y, colWidth - 2, rowHeight, 'F');

      // Border
      doc.setDrawColor(
        this.COLORS.slate900[0],
        this.COLORS.slate900[1],
        this.COLORS.slate900[2]
      );
      doc.setLineWidth(0.5);
      doc.rect(x, y, colWidth - 2, rowHeight);

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(metric.label, x + 3, y + 4);

      // Value
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      const valueLines = doc.splitTextToSize(metric.value, colWidth - 6);
      doc.text(valueLines, x + 3, y + 11);
    }

    return yPosition + 36;
  }

  // =====================================
  // SECTION: KEY INSIGHTS
  // =====================================

  /**
   * Single insight section (one per page)
   */
  private addInsightSection(
    doc: any,
    insight: any,
    insightNumber: number,
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    const pageBottomMargin = 20;

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.text(`Insight ${insightNumber}: ${insight.title}`, margin, yPosition);

    // Underline
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 1, margin + 50, yPosition + 1);

    yPosition += 7;

    // Overview
    yPosition = this.addSectionWithTitle(
      doc,
      'Overview',
      insight.executiveSummary,
      yPosition,
      contentWidth,
      margin,
      pageHeight,
      pageBottomMargin
    );
    yPosition += 3;

    // Core Analysis
    yPosition = this.addSectionWithTitle(
      doc,
      'Core Analysis',
      insight.coreInsight,
      yPosition,
      contentWidth,
      margin,
      pageHeight,
      pageBottomMargin
    );
    yPosition += 3;

    // Implications (3-column layout)
    if (
      insight.implications &&
      (insight.implications.upside ||
        insight.implications.downside ||
        insight.implications.executionRisks)
    ) {
      yPosition = this.addImplicationsSection(
        doc,
        insight.implications,
        yPosition,
        contentWidth,
        margin,
        pageHeight,
        pageBottomMargin
      );
      yPosition += 3;
    }

    // Reasoning Chain
    if (insight.reasoningChain && insight.reasoningChain.length > 0) {
      yPosition = this.addReasoningChain(
        doc,
        insight.reasoningChain,
        yPosition,
        contentWidth,
        margin,
        pageHeight,
        pageBottomMargin
      );
      yPosition += 3;
    }

    // Investor Takeaway (highlight box)
    if (yPosition > pageHeight - pageBottomMargin - 15) {
      doc.addPage();
      yPosition = 28;
    }

    yPosition = this.addTakeawayBox(
      doc,
      insight.investorTakeaway,
      yPosition,
      contentWidth,
      margin
    );

    return yPosition;
  }

  /**
   * Section with title and justified paragraph
   */
  private addSectionWithTitle(
    doc: any,
    title: string,
    content: string,
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number,
    pageBottomMargin: number
  ): number {
    // Check page break
    if (yPosition > pageHeight - pageBottomMargin - 12) {
      doc.addPage();
      yPosition = 28;
    }

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.text(title, margin, yPosition);
    yPosition += 4;

    // Content (left-aligned, not justified to prevent stretching)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.slate700[0],
      this.COLORS.slate700[1],
      this.COLORS.slate700[2]
    );

    const lines = doc.splitTextToSize(content, contentWidth);
    lines.forEach((line: string, index: number) => {
      if (yPosition > pageHeight - pageBottomMargin - 4) {
        doc.addPage();
        yPosition = 28;
      }
      // Left-aligned for cleaner appearance
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });

    return yPosition;
  }

  /**
   * Implications section (Upside, Downside, Risks in 3 columns)
   */
  private addImplicationsSection(
    doc: any,
    implications: any,
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number,
    pageBottomMargin: number
  ): number {
    // Check page break
    if (yPosition > pageHeight - pageBottomMargin - 25) {
      doc.addPage();
      yPosition = 28;
    }

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.text('Implications', margin, yPosition);
    yPosition += 5;

    const colWidth = contentWidth / 3;
    const items = [
      {
        label: 'Upside',
        value: implications.upside,
        color: this.COLORS.teal500,
      },
      {
        label: 'Downside',
        value: implications.downside,
        color: this.COLORS.teal600,
      },
      {
        label: 'Execution Risks',
        value: implications.executionRisks,
        color: this.COLORS.teal700,
      },
    ];

    // Draw boxes
    items.forEach((item, index) => {
      const x = margin + index * colWidth;

      // Background
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(x, yPosition, colWidth - 2, 22, 'F');

      // Border
      doc.setDrawColor(
        this.COLORS.slate900[0],
        this.COLORS.slate900[1],
        this.COLORS.slate900[2]
      );
      doc.setLineWidth(0.5);
      doc.rect(x, yPosition, colWidth - 2, 22);

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(item.label, x + 2, yPosition + 3);

      // Value
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      const lines = doc.splitTextToSize(item.value, colWidth - 4);
      doc.text(lines, x + 2, yPosition + 8);
    });

    return yPosition + 26;
  }

  /**
   * Reasoning chain with step numbers
   */
  private addReasoningChain(
    doc: any,
    chain: any[],
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number,
    pageBottomMargin: number
  ): number {
    // Check page break
    if (yPosition > pageHeight - pageBottomMargin - 15) {
      doc.addPage();
      yPosition = 28;
    }

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(
      this.COLORS.teal600[0],
      this.COLORS.teal600[1],
      this.COLORS.teal600[2]
    );
    doc.text('Reasoning Chain', margin, yPosition);
    yPosition += 5;

    // Steps
    chain.forEach((step) => {
      if (yPosition > pageHeight - pageBottomMargin - 8) {
        doc.addPage();
        yPosition = 28;
      }

      // Step number and reasoning
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(
        this.COLORS.teal700[0],
        this.COLORS.teal700[1],
        this.COLORS.teal700[2]
      );
      const stepText = `${step.step}. ${step.reasoning}`;
      const stepLines = doc.splitTextToSize(stepText, contentWidth - 4);
      doc.text(stepLines, margin + 2, yPosition);
      yPosition += stepLines.length * 3.5 + 1;

      // Evidence reference (if present)
      if (step.evidenceReference) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(
          this.COLORS.slate600[0],
          this.COLORS.slate600[1],
          this.COLORS.slate600[2]
        );
        const evidenceLines = doc.splitTextToSize(
          `Evidence: ${step.evidenceReference}`,
          contentWidth - 8
        );
        doc.text(evidenceLines, margin + 4, yPosition);
        yPosition += evidenceLines.length * 2.8 + 2;
      }
    });

    return yPosition;
  }

  /**
   * Takeaway highlight box - with page break protection
   */
  private addTakeawayBox(
    doc: any,
    takeaway: string,
    yPosition: number,
    contentWidth: number,
    margin: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageBottomMargin = 20;

    // Force new page if not enough space (need min 25mm for box + content)
    if (yPosition > pageHeight - pageBottomMargin - 25) {
      doc.addPage();
      yPosition = 28;
    }

    // Background box header
    doc.setFillColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.rect(margin - 1, yPosition - 2, contentWidth + 2, 6, 'F');

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Key Takeaway for Investors', margin + 2, yPosition + 2);

    yPosition += 8;

    // Content (slightly smaller font to ensure it fits)
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(
      this.COLORS.slate700[0],
      this.COLORS.slate700[1],
      this.COLORS.slate700[2]
    );

    const lines = doc.splitTextToSize(takeaway, contentWidth - 4);

    // Calculate if content will fit on page
    const contentHeight = lines.length * 3.8;
    if (yPosition + contentHeight > pageHeight - pageBottomMargin - 3) {
      // Content won't fit - start on new page
      doc.addPage();
      yPosition = 28;

      // Redraw header on new page
      doc.setFillColor(
        this.COLORS.teal500[0],
        this.COLORS.teal500[1],
        this.COLORS.teal500[2]
      );
      doc.rect(margin - 1, yPosition - 2, contentWidth + 2, 6, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Key Takeaway for Investors', margin + 2, yPosition + 2);

      yPosition += 8;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(
        this.COLORS.slate700[0],
        this.COLORS.slate700[1],
        this.COLORS.slate700[2]
      );
    }

    // Draw content
    doc.text(lines, margin + 2, yPosition);

    return yPosition + lines.length * 3.8 + 4;
  }

  // =====================================
  // SECTION: RISK ASSESSMENT
  // =====================================

  /**
   * Risk assessment section with severity indicators
   */
  private addRiskAssessmentSection(
    doc: any,
    risks: any[],
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    const pageBottomMargin = 20;

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.text('Risk Assessment', margin, yPosition);

    // Underline
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 1, margin + 40, yPosition + 1);

    yPosition += 7;

    // Risk items
    risks.forEach((risk) => {
      if (yPosition > pageHeight - pageBottomMargin - 12) {
        doc.addPage();
        yPosition = 28;
      }

      // Severity badge (color based on level)
      const severityColor =
        risk.severity === 'high'
          ? this.COLORS.slate900
          : risk.severity === 'medium'
          ? this.COLORS.teal600
          : this.COLORS.teal500;

      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.rect(margin, yPosition - 2.5, 18, 5, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(risk.severity.toUpperCase(), margin + 2, yPosition + 0.5);

      // Risk factor
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(
        this.COLORS.slate900[0],
        this.COLORS.slate900[1],
        this.COLORS.slate900[2]
      );
      doc.text(risk.factor, margin + 20, yPosition);
      yPosition += 5;

      // Impact
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(
        this.COLORS.slate700[0],
        this.COLORS.slate700[1],
        this.COLORS.slate700[2]
      );
      const impactLines = doc.splitTextToSize(risk.impact, contentWidth - 8);
      doc.text(impactLines, margin + 2, yPosition);

      yPosition += impactLines.length * 3.5 + 3;
    });

    return yPosition;
  }

  // =====================================
  // SECTION: SOURCES & REFERENCES
  // =====================================

  /**
   * Sources section
   */
  private addSourcesSection(
    doc: any,
    sources: any[],
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number
  ): void {
    const pageBottomMargin = 20;

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.text('Sources & References', margin, yPosition);

    // Underline
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 1, margin + 50, yPosition + 1);

    yPosition += 7;

    // Source items
    sources.forEach((source) => {
      if (yPosition > pageHeight - pageBottomMargin - 12) {
        doc.addPage();
        yPosition = 28;
      }

      // Source type badge
      doc.setFillColor(
        this.COLORS.teal500[0],
        this.COLORS.teal500[1],
        this.COLORS.teal500[2]
      );
      doc.rect(margin, yPosition - 2, 16, 4, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(source.type.toUpperCase(), margin + 1, yPosition + 0.5);

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(
        this.COLORS.slate900[0],
        this.COLORS.slate900[1],
        this.COLORS.slate900[2]
      );
      doc.text(source.title, margin + 18, yPosition);
      yPosition += 4.5;

      // URL (if present)
      if (source.url) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(
          this.COLORS.teal600[0],
          this.COLORS.teal600[1],
          this.COLORS.teal600[2]
        );
        const urlLines = doc.splitTextToSize(source.url, contentWidth - 6);
        doc.text(urlLines, margin + 2, yPosition);
        yPosition += urlLines.length * 2.8 + 1;
      }

      // Relevance (if present)
      if (source.relevance) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(
          this.COLORS.slate600[0],
          this.COLORS.slate600[1],
          this.COLORS.slate600[2]
        );
        doc.text(`Relevance: ${source.relevance}`, margin + 2, yPosition);
        yPosition += 3;
      }

      yPosition += 2;
    });
  }

  // =====================================
  // UTILITY: BULLET SECTIONS
  // =====================================

  /**
   * Bullet point section (Strengths, Improvements)
   */
  private addBulletSection(
    doc: any,
    title: string,
    items: string[],
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number
  ): number {
    if (!items || items.length === 0) {
      return yPosition;
    }

    const pageBottomMargin = 20;

    if (yPosition > pageHeight - pageBottomMargin - 15) {
      doc.addPage();
      yPosition = 28;
    }

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(
      this.COLORS.slate900[0],
      this.COLORS.slate900[1],
      this.COLORS.slate900[2]
    );
    doc.text(title, margin, yPosition);

    // Underline
    doc.setDrawColor(
      this.COLORS.teal500[0],
      this.COLORS.teal500[1],
      this.COLORS.teal500[2]
    );
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 1, margin + 35, yPosition + 1);

    yPosition += 6;

    // Bullets
    items.forEach((item) => {
      if (yPosition > pageHeight - pageBottomMargin - 6) {
        doc.addPage();
        yPosition = 28;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(
        this.COLORS.slate700[0],
        this.COLORS.slate700[1],
        this.COLORS.slate700[2]
      );

      // Bullet
      doc.text('•', margin + 1, yPosition);

      // Text (left-aligned, not justified)
      const lines = doc.splitTextToSize(item, contentWidth - 5);
      doc.text(lines, margin + 5, yPosition);

      yPosition += lines.length * 3.5 + 1;
    });

    return yPosition;
  }
}

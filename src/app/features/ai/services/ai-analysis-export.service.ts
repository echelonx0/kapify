import { Injectable } from '@angular/core';
import { DocumentAnalysisResult } from './funder-document-analysis.service';

/**
 * Analysis Report Export Service
 * Generates professional PDF reports from analysis results
 */
@Injectable({
  providedIn: 'root',
})
export class AnalysisReportExportService {
  /**
   * Export analysis to PDF
   * Multi-page professional layout with design system styling
   */
  async exportToPDF(
    analysis: DocumentAnalysisResult,
    fileName?: string
  ): Promise<void> {
    console.log('📄 [EXPORT] Generating PDF analysis report...');

    try {
      const { jsPDF } = await import('jspdf');

      // Create PDF document (Letter size, portrait)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      let currentPage = 1;
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const lineHeight = 5;

      // ====== PAGE 1: EXECUTIVE SUMMARY ======
      this.addHeader(doc, 'Investment Analysis Report', 'Executive Summary');

      // Key metrics
      yPosition = this.addKeyMetrics(doc, analysis, 30, contentWidth, margin);
      yPosition += 8;

      // Strengths
      yPosition = this.addSection(
        doc,
        'Key Strengths',
        analysis.strengths,
        yPosition,
        contentWidth,
        margin,
        pageHeight
      );

      // Improvement areas
      yPosition = this.addSection(
        doc,
        'Improvement Areas',
        analysis.improvementAreas,
        yPosition,
        contentWidth,
        margin,
        pageHeight
      );

      // ====== PAGE 2+: KEY INSIGHTS ======
      if (analysis.keyInsights && analysis.keyInsights.length > 0) {
        analysis.keyInsights.forEach((insight, index) => {
          // New page for each insight
          doc.addPage();
          yPosition = 20;

          this.addHeader(
            doc,
            `Insight ${index + 1}`,
            insight.title.substring(0, 40) + '...'
          );

          yPosition = 35;

          // Executive Summary
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Overview', margin, yPosition);
          yPosition += 6;

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          const summaryLines = doc.splitTextToSize(
            insight.executiveSummary,
            contentWidth
          );
          doc.text(summaryLines, margin, yPosition);
          yPosition += summaryLines.length * lineHeight + 4;

          // Core Insight
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Core Analysis', margin, yPosition);
          yPosition += 6;

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          const coreLines = doc.splitTextToSize(
            insight.coreInsight,
            contentWidth
          );
          doc.text(coreLines, margin, yPosition);
          yPosition += coreLines.length * lineHeight + 4;

          // Implications Grid (3 columns)
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }

          yPosition = this.addImplicationsGrid(
            doc,
            insight.implications,
            yPosition,
            margin,
            contentWidth,
            pageHeight
          );

          // Reasoning Chain
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          if (insight.reasoningChain && insight.reasoningChain.length > 0) {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Reasoning Chain', margin, yPosition);
            yPosition += 6;

            insight.reasoningChain.forEach((step) => {
              if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(10);
              doc.setTextColor(20, 184, 166); // teal
              doc.text(`${step.step}. ${step.reasoning}`, margin, yPosition);
              yPosition += 6;

              if (step.evidenceReference) {
                doc.setFont('Helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139); // slate-600
                doc.text(
                  `Evidence: ${step.evidenceReference}`,
                  margin + 4,
                  yPosition
                );
                yPosition += 5;
              }

              doc.setTextColor(0, 0, 0);
              yPosition += 2;
            });
          }

          // Investor Takeaway
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFillColor(20, 184, 166); // teal-500
          doc.rect(margin - 1, yPosition - 3, contentWidth + 2, 8, 'F');

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text('Investor Takeaway', margin + 2, yPosition + 2);

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);

          yPosition += 8;
          const takeawayLines = doc.splitTextToSize(
            insight.investorTakeaway,
            contentWidth
          );
          doc.text(takeawayLines, margin, yPosition);
          yPosition += takeawayLines.length * lineHeight;
        });
      }

      // ====== RISK ASSESSMENT PAGE ======
      if (analysis.riskFactors && analysis.riskFactors.length > 0) {
        doc.addPage();
        yPosition = 20;

        this.addHeader(doc, 'Risk Assessment', '');

        yPosition = 35;
        analysis.riskFactors.forEach((risk) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          // Risk severity badge
          const severityColor =
            risk.severity === 'high'
              ? [220, 38, 38]
              : risk.severity === 'medium'
              ? [217, 119, 6]
              : [34, 197, 94];

          doc.setFillColor(
            severityColor[0],
            severityColor[1],
            severityColor[2]
          );
          doc.rect(margin, yPosition - 2, 20, 5, 'F');

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text(risk.severity.toUpperCase(), margin + 2, yPosition + 1);

          doc.setTextColor(0, 0, 0);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(risk.factor, margin + 24, yPosition);
          yPosition += 6;

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          const impactLines = doc.splitTextToSize(
            risk.impact,
            contentWidth - 4
          );
          doc.text(impactLines, margin + 2, yPosition);
          yPosition += impactLines.length * 4 + 3;
        });
      }

      // ====== SOURCES PAGE ======
      if (analysis.sources && analysis.sources.length > 0) {
        doc.addPage();
        yPosition = 20;

        this.addHeader(doc, 'Sources & References', '');

        yPosition = 35;
        analysis.sources.forEach((source) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(20, 184, 166); // teal
          doc.text(`[${source.type}]`, margin, yPosition);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text(source.title, margin + 20, yPosition);
          yPosition += 5;

          if (source.url) {
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(59, 130, 246); // blue
            const urlLines = doc.splitTextToSize(source.url, contentWidth - 4);
            doc.text(urlLines, margin + 2, yPosition);
            yPosition += urlLines.length * 3 + 2;
          }

          if (source.relevance) {
            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139); // slate-600
            doc.text(`Relevance: ${source.relevance}`, margin + 2, yPosition);
            yPosition += 4;
          }

          yPosition += 2;
        });
      }

      // ====== FINAL PAGE: FOOTER ======
      doc.addPage();
      yPosition = pageHeight - 60;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(20, 184, 166); // teal

      doc.text('Report Generated by Kapify.Africa', pageWidth / 2, yPosition, {
        align: 'center',
      });

      yPosition += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-600
      doc.text(
        `Analysis Confidence: ${analysis.confidence}%`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

      yPosition += 6;
      doc.text(`Generated `, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 8;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // slate-400
      doc.text(
        'This analysis is provided for informational purposes only and should not be considered investment advice.',
        pageWidth / 2,
        yPosition,
        { align: 'center', maxWidth: contentWidth }
      );

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFileName = fileName || `Analysis_${timestamp}.pdf`;

      doc.save(finalFileName);
      console.log(`✅ [EXPORT] PDF saved: ${finalFileName}`);
    } catch (error) {
      console.error('❌ [EXPORT] Error generating PDF:', error);
      throw error;
    }
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Add header to page
   */
  private addHeader(doc: any, mainTitle: string, subtitle: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Teal accent line
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(1);
    doc.line(margin, 8, pageWidth - margin, 8);

    // Main title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(mainTitle, margin, 15);

    // Subtitle
    if (subtitle) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(subtitle, margin, 22);
    }
  }

  /**
   * Add key metrics grid
   */
  private addKeyMetrics(
    doc: any,
    analysis: DocumentAnalysisResult,
    yPosition: number,
    contentWidth: number,
    margin: number
  ): number {
    const colWidth = contentWidth / 4;
    const metrics = [
      {
        label: 'Investability',
        value: `${analysis.matchScore}%`,
        color: [59, 130, 246],
      }, // blue
      {
        label: 'Success Prob.',
        value: `${analysis.successProbability}%`,
        color: [34, 197, 94],
      }, // green
      {
        label: 'Market Timing',
        value: analysis.marketTimingInsight,
        color: [168, 85, 247],
      }, // purple
      {
        label: 'Competitive Pos.',
        value: analysis.competitivePositioning,
        color: [249, 115, 22],
      }, // orange
    ];

    metrics.forEach((metric, index) => {
      const x = margin + index * colWidth;

      // Background box
      doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.rect(x, yPosition, colWidth - 2, 20, 'F');

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(metric.label, x + 3, yPosition + 4);

      // Value
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      const valueLines = doc.splitTextToSize(metric.value, colWidth - 6);
      doc.text(valueLines, x + 3, yPosition + 12);
    });

    return yPosition + 25;
  }

  /**
   * Add text section
   */
  private addSection(
    doc: any,
    title: string,
    items: string[],
    yPosition: number,
    contentWidth: number,
    margin: number,
    pageHeight: number,
    color: number[] = [20, 184, 166]
  ): number {
    if (!items || items.length === 0) {
      return yPosition;
    }

    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Title with colored underline
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, margin, yPosition);

    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 1, margin + 40, yPosition + 1);

    yPosition += 8;

    // Items
    items.forEach((item) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Bullet
      doc.text('•', margin + 1, yPosition);

      // Text
      const lines = doc.splitTextToSize(item, contentWidth - 4);
      doc.text(lines, margin + 5, yPosition);

      yPosition += lines.length * 4.5 + 2;
    });

    return yPosition;
  }

  /**
   * Add implications grid (Upside, Downside, Risks)
   */
  private addImplicationsGrid(
    doc: any,
    implications: any,
    yPosition: number,
    margin: number,
    contentWidth: number,
    pageHeight: number
  ): number {
    const colWidth = contentWidth / 3;
    const colors = [
      { bg: [220, 252, 231], text: [22, 163, 74] }, // green
      { bg: [254, 243, 219], text: [180, 83, 9] }, // orange
      { bg: [254, 226, 226], text: [220, 38, 38] }, // red
    ];

    const items = [
      { label: 'Upside', value: implications.upside },
      { label: 'Downside', value: implications.downside },
      { label: 'Execution Risks', value: implications.executionRisks },
    ];

    items.forEach((item, index) => {
      const x = margin + index * colWidth;

      // Background
      doc.setFillColor(
        colors[index].bg[0],
        colors[index].bg[1],
        colors[index].bg[2]
      );
      doc.rect(x, yPosition, colWidth - 2, 30, 'F');

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(
        colors[index].text[0],
        colors[index].text[1],
        colors[index].text[2]
      );
      doc.text(item.label, x + 2, yPosition + 3);

      // Value
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(item.value, colWidth - 4);
      doc.text(lines, x + 2, yPosition + 8);
    });

    return yPosition + 35;
  }
}

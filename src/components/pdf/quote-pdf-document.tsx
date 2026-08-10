import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { QuotePdfDocumentModel } from "@/lib/pdf/document-model";
import { formatCurrency, formatShortDate } from "@/lib/format";

const colors = {
  text: "#0F172A",
  muted: "#64748B",
  border: "#CBD5E1",
  primary: "#1D4ED8",
  surface: "#F8FAFC",
  watermark: "#94A3B8",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.text,
  },
  compactHeader: {
    position: "absolute",
    top: 18,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    minHeight: 14,
  },
  compactLeft: {
    fontSize: 8,
    color: colors.muted,
  },
  compactRight: {
    fontSize: 8,
    color: colors.text,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
    maxWidth: "75%",
  },
  footerPage: {
    fontSize: 8,
    color: colors.muted,
  },
  watermark: {
    position: "absolute",
    top: "42%",
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 64,
    color: colors.watermark,
    opacity: 0.12,
    letterSpacing: 6,
    fontFamily: "Helvetica-Bold",
    transform: "rotate(-28deg)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: "row",
    gap: 10,
    maxWidth: "70%",
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 1,
  },
  quoteIdBlock: {
    alignItems: "flex-end",
  },
  quoteIdLabel: {
    fontSize: 8,
    color: colors.muted,
  },
  quoteIdValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 14,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  metaItem: {
    width: "32%",
  },
  metaLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  mutedText: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 1,
  },
  categoryTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
    color: colors.primary,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  colDesc: { width: "46%", paddingRight: 4 },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "right" },
  colPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "17%", textAlign: "right" },
  colDescWide: { width: "56%", paddingRight: 4 },
  headerCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.muted,
    textTransform: "uppercase",
  },
  cell: {
    fontSize: 8,
  },
  totalsWrap: {
    marginTop: 14,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    backgroundColor: colors.surface,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsLabel: {
    fontSize: 8,
    color: colors.muted,
  },
  totalsValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  grandValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  proseBlock: {
    marginTop: 14,
  },
  proseTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  proseBody: {
    fontSize: 8,
    lineHeight: 1.45,
    color: colors.text,
  },
});

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return formatShortDate(value);
  } catch {
    return value;
  }
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

type QuotePdfDocumentProps = {
  model: QuotePdfDocumentModel;
};

export function QuotePdfDocument({ model }: QuotePdfDocumentProps) {
  const { company, quote, customer, sections, showUnitColumn, totals } = model;
  const compactLeft = [company.companyName, customer.customerName]
    .filter((part) => part.trim())
    .join(" · ");
  const footerLeft =
    [company.pdfFooterText.trim(), company.website.trim()]
      .filter(Boolean)
      .join(" · ") || company.companyName;

  return (
    <Document
      title={`Quote ${quote.quoteId}`}
      author={company.companyName}
      subject="Customer quote"
      creator="Quote Generator Pro"
    >
      <Page size="LETTER" style={styles.page} wrap>
        {model.showDraftWatermark ? (
          <Text style={styles.watermark} fixed>
            DRAFT
          </Text>
        ) : null}

        <View style={styles.compactHeader} fixed>
          <Text
            style={styles.compactLeft}
            render={({ pageNumber }) =>
              pageNumber > 1 ? compactLeft : " "
            }
          />
          <Text
            style={styles.compactRight}
            render={({ pageNumber }) =>
              pageNumber > 1 ? quote.quoteId : " "
            }
          />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {company.logoDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
              <Image src={company.logoDataUrl} style={styles.logo} />
            ) : null}
            <View>
              <Text style={styles.companyName}>{dash(company.companyName)}</Text>
              {company.addressLine ? (
                <Text style={styles.contactLine}>{company.addressLine}</Text>
              ) : null}
              {company.cityStateZip ? (
                <Text style={styles.contactLine}>{company.cityStateZip}</Text>
              ) : null}
              <Text style={styles.contactLine}>
                {[company.phone, company.email, company.website]
                  .filter((part) => part.trim())
                  .join(" · ") || "—"}
              </Text>
            </View>
          </View>
          <View style={styles.quoteIdBlock}>
            <Text style={styles.quoteIdLabel}>Quote ID</Text>
            <Text style={styles.quoteIdValue}>{quote.quoteId}</Text>
          </View>
        </View>

        <Text style={styles.title}>QUOTE</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Quote Date</Text>
            <Text style={styles.metaValue}>{formatDate(quote.quoteDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={styles.metaValue}>{formatDate(quote.validUntil)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Prepared By</Text>
            <Text style={styles.metaValue}>{dash(quote.preparedBy)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Service / Bill To</Text>
        <Text style={styles.bodyText}>{dash(customer.customerName)}</Text>
        {customer.companyName ? (
          <Text style={styles.bodyText}>{customer.companyName}</Text>
        ) : null}
        {customer.phone ? (
          <Text style={styles.mutedText}>{customer.phone}</Text>
        ) : null}
        {customer.email ? (
          <Text style={styles.mutedText}>{customer.email}</Text>
        ) : null}
        {customer.addressLine ? (
          <Text style={styles.mutedText}>{customer.addressLine}</Text>
        ) : null}
        {customer.cityStateZip ? (
          <Text style={styles.mutedText}>{customer.cityStateZip}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Job / Service Description</Text>
        <Text style={styles.bodyText}>{dash(quote.jobDescription)}</Text>

        {sections.map((section) => (
          <View key={section.category}>
            <View wrap={false}>
              <Text style={styles.categoryTitle}>{section.category}</Text>
              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.headerCell,
                    showUnitColumn ? styles.colDesc : styles.colDescWide,
                  ]}
                >
                  Description
                </Text>
                <Text style={[styles.headerCell, styles.colQty]}>Qty</Text>
                {showUnitColumn ? (
                  <Text style={[styles.headerCell, styles.colUnit]}>Unit</Text>
                ) : null}
                <Text style={[styles.headerCell, styles.colPrice]}>
                  Unit Price
                </Text>
                <Text style={[styles.headerCell, styles.colTotal]}>
                  Line Total
                </Text>
              </View>
              {section.rows[0] ? (
                <LineRow
                  row={section.rows[0]}
                  showUnitColumn={showUnitColumn}
                />
              ) : null}
            </View>
            {section.rows.slice(1).map((row) => (
              <LineRow
                key={row.id}
                row={row}
                showUnitColumn={showUnitColumn}
              />
            ))}
          </View>
        ))}

        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(totals.subtotal)}
              </Text>
            </View>
            {totals.showDiscount ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{totals.discountLabel}</Text>
                <Text style={styles.totalsValue}>
                  −{formatCurrency(totals.discountAmount)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({totals.taxRate.toFixed(2)}%)
              </Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(totals.taxAmount)}
              </Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={styles.grandValue}>
                {formatCurrency(totals.grandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {quote.customerFacingMessage.trim() ? (
          <View style={styles.proseBlock}>
            <Text style={styles.proseTitle}>Message</Text>
            <Text style={styles.proseBody}>
              {quote.customerFacingMessage.trim()}
            </Text>
          </View>
        ) : null}

        {quote.termsAndConditions.trim() ? (
          <View style={styles.proseBlock}>
            <Text style={styles.proseTitle}>Terms and Conditions</Text>
            <Text style={styles.proseBody}>
              {quote.termsAndConditions.trim()}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerLeft}</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function LineRow({
  row,
  showUnitColumn,
}: {
  row: QuotePdfDocumentModel["sections"][number]["rows"][number];
  showUnitColumn: boolean;
}) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text
        style={[
          styles.cell,
          showUnitColumn ? styles.colDesc : styles.colDescWide,
        ]}
      >
        {row.description}
      </Text>
      <Text style={[styles.cell, styles.colQty]}>
        {formatQuantity(row.quantity)}
      </Text>
      {showUnitColumn ? (
        <Text style={[styles.cell, styles.colUnit]}>{row.unit || "—"}</Text>
      ) : null}
      <Text style={[styles.cell, styles.colPrice]}>
        {formatCurrency(row.unitPrice)}
      </Text>
      <Text style={[styles.cell, styles.colTotal]}>
        {formatCurrency(row.lineTotal)}
      </Text>
    </View>
  );
}

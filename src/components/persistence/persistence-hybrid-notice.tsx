type PersistenceHybridNoticeProps = {
  show: boolean;
};

/**
 * Concise development/database-mode notice.
 * Hidden in session mode. Database mode is not production-secure until M18 auth.
 */
export function PersistenceHybridNotice({ show }: PersistenceHybridNoticeProps) {
  if (!show) return null;
  return (
    <p
      className="mb-4 rounded-[var(--radius-md)] border border-border-default bg-bg-muted px-3 py-2 text-sm text-text-secondary"
      role="status"
    >
      Development persistence enabled (non-production only until M18 auth).
      Company Settings and Service Catalog are database-backed. Customers and
      Quotes remain demo/session data. Demo sign-in is not server security.
    </p>
  );
}

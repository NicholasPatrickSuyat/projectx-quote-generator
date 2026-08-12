type PersistenceHybridNoticeProps = {
  show: boolean;
};

/**
 * Concise local-development database-mode notice.
 * Hidden in session mode. Demo+database is refused outside APP_ENV=development.
 */
export function PersistenceHybridNotice({ show }: PersistenceHybridNoticeProps) {
  if (!show) return null;
  return (
    <p
      className="mb-4 rounded-[var(--radius-md)] border border-border-default bg-bg-muted px-3 py-2 text-sm text-text-secondary"
      role="status"
    >
      Local database persistence (development only). Company Settings and
      Service Catalog are database-backed. Customers and Quotes remain session
      data. Demo+database is refused on preview/production hosts. Durable writes
      require AUTH_MODE=production with real server authorization.
    </p>
  );
}

export type ContactSortOrder = "desc" | "asc";

export interface ContactApiRow {
  id: string;
  snapshot_name: string;
  snapshot_company: string | null;
  card_snapshot: unknown;
  created_at: string;
}

export interface ContactItemData {
  id: string;
  snapshotName: string;
  snapshotCompany: string | null;
  createdAt: string;
  logoUrl: string | null;
  displayName: string;
  displayCompany: string;
  displayTitle: string | null;
  contactLines: string[];
}

type SnapshotRecord = Record<string, unknown>;

const toStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toSnapshotRecord = (value: unknown): SnapshotRecord | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as SnapshotRecord;
  }

  return null;
};

const buildContactLines = (snapshot: SnapshotRecord | null): string[] => {
  if (!snapshot) return [];

  const customFields = snapshot.custom_fields;
  if (!Array.isArray(customFields)) return [];

  return customFields
    .filter((field): field is { slot: number; label: string; value: string } =>
      field !== null &&
      typeof field === 'object' &&
      typeof (field as SnapshotRecord).slot === 'number' &&
      typeof (field as SnapshotRecord).label === 'string' &&
      typeof (field as SnapshotRecord).value === 'string' &&
      (field as SnapshotRecord).slot !== 0 &&
      ((field as SnapshotRecord).value as string).trim().length > 0
    )
    .sort((a, b) => a.slot - b.slot)
    .map((field) =>
      field.label.trim() ? `${field.label}  ${field.value}` : field.value
    );
};

export const normalizeContact = (row: ContactApiRow): ContactItemData => {
  const snapshot = toSnapshotRecord(row.card_snapshot);

  const snapshotName = row.snapshot_name;
  const snapshotCompany = row.snapshot_company;

  const displayName =
    toStringValue(snapshot?.name) ||
    toStringValue(snapshot?.full_name) ||
    snapshotName;

  const displayCompany =
    toStringValue(snapshot?.company) || snapshotCompany || "会社名未設定";

  const displayTitle =
    toStringValue(snapshot?.title) ||
    toStringValue(snapshot?.position) ||
    toStringValue(snapshot?.role);

  const logoUrl =
    toStringValue(snapshot?.logo_url) ||
    toStringValue(snapshot?.logoUrl) ||
    toStringValue(snapshot?.logo_path);

  return {
    id: row.id,
    snapshotName,
    snapshotCompany,
    createdAt: row.created_at,
    logoUrl,
    displayName,
    displayCompany,
    displayTitle,
    contactLines: buildContactLines(snapshot),
  };
};

import { supabase } from "../../../utils/supabase";
import {
  ContactApiRow,
  ContactItemData,
  ContactSortOrder,
  normalizeContact,
} from "../types";

export const fetchContacts = async (
  ownerId: string,
  sortOrder: ContactSortOrder = "desc",
): Promise<ContactItemData[]> => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, snapshot_name, snapshot_company, card_snapshot, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: sortOrder === "asc" });

  if (error) {
    throw new Error(`受け取り名刺の取得に失敗しました: ${error.message}`);
  }

  const rows = (data || []) as ContactApiRow[];
  return rows.map(normalizeContact);
};

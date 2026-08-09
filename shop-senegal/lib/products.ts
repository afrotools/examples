import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/types";

interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    imageUrl: row.image_url,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, image_url")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase getAllProducts error: ${error.message}`);

  return (data as ProductRow[]).map(mapRow);
}

/** Used to re-price an order server-side — never trust client-submitted prices. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, image_url")
    .in("id", ids);

  if (error) throw new Error(`Supabase getProductsByIds error: ${error.message}`);

  return (data as ProductRow[]).map(mapRow);
}

import supabase from "../db/supabase-client";
import { sampleMenu } from "./menu";

export const usesSampleMenu = !supabase;

export async function getDrinks(category) {
  if (!supabase)
    return sampleMenu.filter(
      (drink) => !category || drink.category === category,
    );
  let query = supabase.from("menuitems").select("*").order("name");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error("The menu could not be loaded. Please try again.");
  return data || [];
}

export async function getDrink(category, id) {
  if (!supabase)
    return (
      sampleMenu.find(
        (drink) => drink.category === category && String(drink.itemid) === id,
      ) || null
    );
  const { data, error } = await supabase
    .from("menuitems")
    .select("*")
    .eq("category", category)
    .eq("itemid", id)
    .maybeSingle();
  if (error)
    throw new Error("The recipe could not be loaded. Please try again.");
  if (data && typeof data.descriptions === "string") {
    try {
      data.descriptions = JSON.parse(data.descriptions);
    } catch {
      throw new Error(
        "This recipe is unavailable. Please choose another drink.",
      );
    }
  }
  return data;
}

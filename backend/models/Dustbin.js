const { supabase } = require("../config/db");

exports.create = async ({ latitude, longitude, type }) => {
  const { data, error } = await supabase
    .from("dustbins")
    .insert({ latitude, longitude, fill_level: 0, type })
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.updateFillLevel = async (id, fill_level) => {
  const { data, error } = await supabase
    .from("dustbins")
    .update({ fill_level, last_updated: new Date() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.findAll = async () => {
  const { data, error } = await supabase.from("dustbins").select("*");
  if (error) throw error;
  return data;
};

exports.findById = async (id) => {
  const { data, error } = await supabase
    .from("dustbins")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

import { supabase } from '../lib/supabase';

/**
 * Save a prediction to the database.
 */
export async function savePrediction(predictionData) {
  const { data, error } = await supabase
    .from('predictions')
    .insert([predictionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all predictions for the current user, sorted by newest first.
 */
export async function getUserPredictions() {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Delete a prediction by ID.
 */
export async function deletePrediction(id) {
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

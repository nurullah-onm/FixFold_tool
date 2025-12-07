import { updateEnvSettings } from '../services/settingsService.js';

export async function updateSettings(req, res, next) {
  try {
    const updates = req.body || {};
    const applied = await updateEnvSettings(updates);
    return res.json({ success: true, data: applied });
  } catch (error) {
    return next(error);
  }
}

import { Router } from 'express';
import { themes, groups, lots, activities } from '../data/catalog.js';

const router = Router();

// GET /api/catalog/themes
router.get('/themes', (_req, res) => res.json(themes));

// GET /api/catalog/themes/:id
router.get('/themes/:id', (req, res) => {
  const theme = themes.find(t => t.id === req.params['id'] || t.slug === req.params['id']);
  if (!theme) { res.status(404).json({ error: 'Тематика не найдена' }); return; }
  res.json(theme);
});

// GET /api/catalog/themes/:id/groups
router.get('/themes/:id/groups', (req, res) => {
  const theme = themes.find(t => t.id === req.params['id'] || t.slug === req.params['id']);
  if (!theme) { res.status(404).json({ error: 'Тематика не найдена' }); return; }
  res.json(groups.filter(g => g.themeId === theme.id));
});

// GET /api/catalog/groups/:id
router.get('/groups/:id', (req, res) => {
  const group = groups.find(g => g.id === req.params['id']);
  if (!group) { res.status(404).json({ error: 'Группа не найдена' }); return; }
  res.json(group);
});

// GET /api/lots
router.get('/lots', (req, res) => {
  const { section, themeId, groupId } = req.query as Record<string, string | undefined>;
  let result = [...lots];
  if (section)  result = result.filter(l => l.sectionType === section);
  if (themeId)  result = result.filter(l => l.themeId === themeId);
  if (groupId)  result = result.filter(l => l.groupId === groupId);
  res.json(result);
});

// GET /api/lots/:id
router.get('/lots/:id', (req, res) => {
  const lot = lots.find(l => l.id === req.params['id']);
  if (!lot) { res.status(404).json({ error: 'Лот не найден' }); return; }
  res.json(lot);
});

// GET /api/activity
router.get('/activity', (_req, res) => res.json(activities));

export default router;

const routeService = require('../services/routeServices');

exports.getOptimizedRoute = async (req, res) => {
  const { dustbinIds } = req.body;
  try {
    const route = await routeService.getOptimizedRoute(dustbinIds);
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
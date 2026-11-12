const { getInstagramFeed } = require('../lib/instagram');

module.exports = async (req, res) => {
  try {
    const forceRefresh = req.query && req.query.refresh === '1';
    const payload = await getInstagramFeed({ forceRefresh });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.status(200).send(JSON.stringify(payload));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load Instagram feed', message: err.message });
  }
};


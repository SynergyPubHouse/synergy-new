const Institution = require("../models/Institution");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.searchInstitutions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const norm = q.toLowerCase();
    const results = await Institution.find({
      normalizedName: { $regex: new RegExp("^" + escapeRegex(norm)) },
    })
      .sort({ name: 1 })
      .limit(10)
      .lean();
    res.json(results.map((d) => ({ id: d._id, name: d.name })));
  } catch (err) {
    res.status(500).json({ message: "Error searching institutions", error: err.message });
  }
};

exports.createInstitution = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    const normalizedName = name.toLowerCase();

    const existing = await Institution.findOne({ normalizedName });
    if (existing) return res.status(200).json({ id: existing._id, name: existing.name });

    const created = await Institution.create({ name });
    return res.status(201).json({ id: created._id, name: created.name });
  } catch (err) {
    res.status(500).json({ message: "Error creating institution", error: err.message });
  }
};

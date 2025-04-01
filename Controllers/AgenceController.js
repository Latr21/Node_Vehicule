import { JSONResponse } from '../Classes/JSONResponse.js';
import { Database } from '../Database/database.js';

const database = new Database({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agence_vehicule',
});

/**
 * ## Crée une réponse JSON structurée.
 */
const createJSONResponse = (data, error, req, additionalInfo = {}) => {
	return new JSONResponse(data, error, {
		method: req.method,
		url: req.url,
		timestamp: new Date(),
		...additionalInfo,
	});
};

/**
 * ## Valide les champs d'une agence et retourne une liste d'erreurs s'il y en a.
 */
const validateAgenceFields = body => {
	const errors = [];
	if (!body.nom || typeof body.nom !== 'string') errors.push('Invalid or missing nom');
	if (!body.adresse || typeof body.adresse !== 'string') errors.push('Invalid or missing adresse');
	if (!body.telephone || typeof body.telephone !== 'string') errors.push('Invalid or missing telephone');
	if (!body.email || typeof body.email !== 'string' || !body.email.includes('@'))
		errors.push('Invalid or missing email');
	return errors;
};

/**
 * ## Gère l'exécution d'une requête de base de données et envoie une réponse HTTP.
 */
const handleDatabaseQuery = (query, params, req, res, successCallback) => {
	database
		.query(query, params)
		.then(successCallback)
		.catch(error => {
			const jsonResponse = createJSONResponse(null, error.message, req);
			res.status(500).json(jsonResponse);
		});
};

export const AgenceController = {
	getAllAgences: (req, res) => {
		console.log('Fetching all agences...');
		handleDatabaseQuery('SELECT * FROM agence', [], req, res, rows => {
			const agences = rows.map(row => ({
				id: row.id,
				nom: row.nom,
				adresse: row.adresse,
				telephone: row.telephone,
				email: row.email,
			}));

			res.render('agences', { agences });
		});
	},

	getAgenceById: (req, res) => {
		console.log('Finding agence...');
		const agenceId = parseInt(req.params.id, 10);
		if (isNaN(agenceId)) {
			const jsonResponse = createJSONResponse(null, 'Invalid agence ID', req);
			return res.status(400).json(jsonResponse);
		}

		handleDatabaseQuery('SELECT * FROM agence WHERE id = ?', [agenceId], req, res, rows => {
			if (rows.length === 0) {
				const jsonResponse = createJSONResponse(null, 'Agence not found', req);
				return res.status(404).json(jsonResponse);
			}

			const agence = rows[0];
			const jsonResponse = createJSONResponse(agence, null, req);
			res.status(200).json(jsonResponse);
		});
	},

	createAgence: (req, res) => {
		console.log('Creating agence...');
		const errors = validateAgenceFields(req.body);
		if (errors.length > 0) {
			const jsonResponse = createJSONResponse(null, errors.join(', '), req);
			return res.status(400).json(jsonResponse);
		}

		const { nom, adresse, telephone, email } = req.body;

		handleDatabaseQuery('SELECT * FROM agence WHERE nom = ?', [nom], req, res, rows => {
			if (rows.length > 0) {
				const jsonResponse = createJSONResponse(null, 'Agence already exists', req);
				return res.status(400).json(jsonResponse);
			}

			handleDatabaseQuery(
				'INSERT INTO agence (nom, adresse, telephone, email) VALUES (?, ?, ?, ?, ?)',
				[nom, adresse, telephone, email],
				req,
				res,
				result => {
					const newAgence = { id: result.insertId, nom, adresse, telephone, email };
					const jsonResponse = createJSONResponse(newAgence, null, req);
					res.status(201).json(jsonResponse);
				}
			);
		});
	},

	updateAgence: (req, res) => {
		console.log('Updating agence...');
		const agenceId = parseInt(req.params.id, 10);
		if (isNaN(agenceId)) {
			const jsonResponse = createJSONResponse(null, 'Invalid agence ID', req);
			return res.status(400).json(jsonResponse);
		}

		const errors = validateAgenceFields(req.body);
		if (errors.length > 0) {
			const jsonResponse = createJSONResponse(null, errors.join(', '), req);
			return res.status(400).json(jsonResponse);
		}

		const { nom, adresse, telephone, email } = req.body;

		handleDatabaseQuery('SELECT * FROM agence WHERE id = ?', [agenceId], req, res, rows => {
			if (rows.length === 0) {
				const jsonResponse = createJSONResponse(null, 'Agence not found', req);
				return res.status(404).json(jsonResponse);
			}

			handleDatabaseQuery(
				'UPDATE agence SET nom = ?, adresse = ?, telephone = ?, email = ? WHERE id = ?',
				[nom, adresse, telephone, email, agenceId],
				req,
				res,
				() => {
					const updatedAgence = { id: agenceId, nom, adresse, telephone, email };
					const jsonResponse = createJSONResponse(updatedAgence, null, req);
					res.status(200).json(jsonResponse);
				}
			);
		});
	},

	deleteAgence: (req, res) => {
		console.log('Deleting agence...');
		const agenceId = parseInt(req.params.id, 10);
		if (isNaN(agenceId)) {
			const jsonResponse = createJSONResponse(null, 'Invalid agence ID', req);
			return res.status(400).json(jsonResponse);
		}

		handleDatabaseQuery('SELECT * FROM agence WHERE id = ?', [agenceId], req, res, rows => {
			if (rows.length === 0) {
				const jsonResponse = createJSONResponse(null, 'Agence not found', req);
				return res.status(404).json(jsonResponse);
			}

			handleDatabaseQuery('DELETE FROM agence WHERE id = ?', [agenceId], req, res, () => {
				const jsonResponse = createJSONResponse({ message: 'Agence deleted successfully' }, null, req);
				res.status(200).json(jsonResponse);
			});
		});
	},
};

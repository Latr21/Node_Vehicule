import { JSONResponse } from '../Classes/JSONResponse.js';
import { Database } from '../Database/database.js';

const database = new Database({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'nodejs',
});

/**
 * ## Crée une réponse JSON structurée.
 *
 * @param {any} data - Les données à inclure dans la réponse.
 * @param {Error|null} error - Une erreur à inclure dans la réponse, ou null si aucune erreur.
 * @param {Object} req - L'objet de requête HTTP.
 * @param {string} req.method - La méthode HTTP de la requête (GET, POST, etc.).
 * @param {string} req.url - L'URL de la requête.
 * @param {Object} [additionalInfo={}] - Informations supplémentaires à inclure dans la réponse.
 * @returns {JSONResponse} Une instance de JSONResponse contenant les données, l'erreur, et les métadonnées.
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
 * ## Valide les champs d'un produit et retourne une liste d'erreurs s'il y en a.
 *
 * @param {Object} body - L'objet contenant les champs du produit à valider.
 * @param {string} body.name - Le nom du produit (doit être une chaîne de caractères non vide).
 * @param {number} body.price - Le prix du produit (doit être un nombre non négatif).
 * @param {number} body.quantity - La quantité du produit (doit être un nombre non négatif).
 * @returns {string[]} Une liste de messages d'erreur si des champs sont invalides ou manquants, sinon une liste vide.
 */
const validateAgenceFields = body => {
	const errors = [];
	if (!body.name || typeof body.name !== 'string') errors.push('Invalid or missing name');
	if (body.price === undefined || typeof body.price !== 'number' || body.price < 0)
		errors.push('Invalid or missing price');
	if (body.quantity === undefined || typeof body.quantity !== 'number' || body.quantity < 0)
		errors.push('Invalid or missing quantity');
	return errors;
};

/**
 * ## Gère l'exécution d'une requête de base de données et envoie une réponse HTTP.
 *
 * @param {string} query - La requête SQL à exécuter.
 * @param {Array} params - Les paramètres à passer à la requête SQL.
 * @param {Object} req - L'objet de requête HTTP.
 * @param {Object} res - L'objet de réponse HTTP.
 * @param {Function} successCallback - La fonction à exécuter en cas de succès de la requête.
 *
 * @description
 * Cette fonction exécute une requête SQL en utilisant la méthode `query` de l'objet `database`.
 * En cas de succès, elle appelle la fonction `successCallback` fournie.
 * En cas d'erreur, elle génère une réponse JSON contenant le message d'erreur et renvoie un statut HTTP 500.
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
				name: row.name,
				price: row.price,
				quantity: row.quantity,
				dateOfCreation: row.dateOfCreation,
				dateOfModification: row.dateOfModification,
			}));

			res.render('agences', { agences });
			// const jsonResponse = createJSONResponse(agences, null, req, { count: agences.length });
			// res.status(200).json(jsonResponse);
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

		const { name, price, quantity } = req.body;
		const dateOfCreation = new Date();

		handleDatabaseQuery('SELECT * FROM agence WHERE name = ?', [name], req, res, rows => {
			if (rows.length > 0) {
				const jsonResponse = createJSONResponse(null, 'Agence already exists', req);
				return res.status(400).json(jsonResponse);
			}

			handleDatabaseQuery(
				'INSERT INTO agence (name, price, quantity, dateOfCreation) VALUES (?, ?, ?, ?)',
				[name, price, quantity, dateOfCreation],
				req,
				res,
				result => {
					const newAgence = { id: result.insertId, name, price, quantity, dateOfCreation };
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

		const { name, price, quantity } = req.body;
		const dateOfModification = new Date();

		handleDatabaseQuery('SELECT * FROM agence WHERE id = ?', [agenceId], req, res, rows => {
			if (rows.length === 0) {
				const jsonResponse = createJSONResponse(null, 'Agence not found', req);
				return res.status(404).json(jsonResponse);
			}

			handleDatabaseQuery(
				'UPDATE agence SET name = ?, price = ?, quantity = ?, dateOfModification = ? WHERE id = ?',
				[name, price, quantity, dateOfModification, agenceId],
				req,
				res,
				() => {
					const updatedAgence = { id: agenceId, name, price, quantity, dateOfModification };
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

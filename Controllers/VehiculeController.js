import { JSONResponse } from '../Classes/JSONResponse.js';
import { Database } from '../Database/database.js';

const database = new Database({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'agence_vehicule',
});

const createJSONResponse = (data, error, req, additionalInfo = {}) => {
	return new JSONResponse(data, error, {
		method: req.method,
		url: req.url,
		timestamp: new Date(),
		...additionalInfo,
	});
};
const handleDatabaseQuery = (query, params, req, res, successCallback) => {
	database
		.query(query, params)
		.then(successCallback)
		.catch(error => {
			const jsonResponse = createJSONResponse(null, error.message, req);
			res.status(500).json(jsonResponse);
		});
};
const validateVehiculeFields = body => {
	const errors = [];
	if (!body.marque || typeof body.marque !== 'string') errors.push('Invalid or missing marque');
	if (!body.model || typeof body.model !== 'string') errors.push('Invalid or missing model');
	if (body.annee === undefined || typeof body.annee !== 'number' || body.annee < 1886)
		// Assuming 1886 as the earliest car production year
		errors.push('Invalid or missing annee');
	if (body.statut === undefined || typeof body.statut !== 'string')
		errors.push('Invalid or missing status');
	if (!body.immatriculation || typeof body.immatriculation !== 'string')
		errors.push('Invalid or missing immatriculation');
	return errors;
};

export const VehiculeController = {
	
	getAllVehicules: (req, res) => {
        handleDatabaseQuery(
            `SELECT vehicule.*, agence.nom AS agence_nom
             FROM vehicule
             LEFT JOIN agence ON vehicule.agence_id = agence.id`,
            [],
            req,
            res,
            vehiculeRows => {
                const vehicules = vehiculeRows.map(row => ({
                    id: row.id,
                    marque: row.marque,
                    model: row.model,
                    immatriculation: row.immatriculation,
                    annee: row.annee,
                    prix_par_jour: row.prix_par_jour,
                    statut: row.statut,
                    agence_nom: row.agence_nom || null,
                }));
    
                // On récupère maintenant les agences pour alimenter le <select>
                handleDatabaseQuery('SELECT id, nom FROM agence', [], req, res, agenceRows => {
                    const agences = agenceRows.map(row => ({
                        id: row.id,
                        nom: row.nom,
                    }));
    
                    // On envoie vehicules ET agences à la vue
                    res.render('vehicules', { vehicules, agences });
                });
            }
        );
    },
    

	getVehiculeById: (req, res) => {
		console.log('Finding vehicule...');
		const vehiculeId = parseInt(req.params.id, 10);
		if (isNaN(vehiculeId)) {
			const jsonResponse = createJSONResponse(null, 'Invalid vehicule ID', req);
			return res.status(400).json(jsonResponse);
		}
		database
			.query('SELECT * FROM vehicule WHERE id = ?', [vehiculeId])
			.then(rows => {
				const vehicule = rows.map(row => ({
					id: row.id,
					agence_id: row.agence_id,
					marque: row.marque,
					model: row.model,
					immatriculation: row.immatriculation,
					annee: row.annee,
					statut: row.statut,
					prix_par_jour: row.prix_par_jour,
				}));

				const jsonResponse = createJSONResponse(vehicule, null, req, { count: vehicule.length });
				res.status(200).json(jsonResponse);
			})
			.catch(error => {
				const jsonResponse = createJSONResponse(null, error.message, req);
				res.status(500).json(jsonResponse);
			});
	},

	createVehicule: (req, res) => {
		console.log('Creating vehicule...');
		console.log(req.body);
		req.body.annee = parseInt(req.body.annee, 10);
		req.body.prix_par_jour = parseFloat(req.body.prix_par_jour);
		const errors = validateVehiculeFields(req.body);
		if (errors.length > 0) {
			const jsonResponse = createJSONResponse(null, errors.join(', '), req);
			return res.status(400).json(jsonResponse);
		}
		database
			.query('SELECT * FROM vehicule WHERE immatriculation = ?', [req.body.immatriculation])
			.then(rows => {
				if (rows.length > 0) {
					const jsonResponse = createJSONResponse(null, 'Vehicule already exists', req);
					return res.status(400).json(jsonResponse);
				}

				const { marque, model, immatriculation, annee, statut, prix_par_jour, agence_id } =
					req.body;

				database
					.query(
						'INSERT INTO vehicule (marque, model, immatriculation, annee, statut, prix_par_jour, agence_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
						[marque, model, immatriculation, annee, statut, prix_par_jour, agence_id]
					)
					.then(result => {
						const newVehicule = {
							id: result.insertId,
							agence_id: req.body.agence_id ? req.body.agence_id : null,
							marque,
							model,
							immatriculation,
							annee,
							statut,
							prix_par_jour,
						};

						database.query('SELECT * FROM vehicule').then(rows => {
							const vehicules = rows.map(row => ({
								id: row.id,
								agence_id: row.agence_id,
								marque: row.marque,
								model: row.model,
								immatriculation: row.immatriculation,
								annee: row.annee,
								statut: row.statut,
								prix_par_jour: row.prix_par_jour,
							}));

							database.query('SELECT * FROM agence').then(rows => {
								const agences = rows.map(row => ({
									id: row.id,
									nom: row.nom,
									adresse: row.adresse,
									telephone: row.telephone,
									email: row.email,
								}));
								res.render('vehicules', { vehicules, agences });
							});
						});

						// const jsonResponse = createJSONResponse(newVehicule, null, req);
						// res.status(201).json(jsonResponse);
					})
					.catch(error => {
						const jsonResponse = createJSONResponse(null, error.message, req);
						res.status(500).json(jsonResponse);
					});
			})
			.catch(error => {
				const jsonResponse = createJSONResponse(null, error.message, req);
				res.status(500).json(jsonResponse);
			});
	},

	updateVehicule: (req, res) => {
		console.log('Updating vehicule...');
		const vehiculeId = parseInt(req.params.id, 10);
		if (isNaN(vehiculeId)) {
			const jsonResponse = createJSONResponse(null, 'Invalid vehicule ID', req);
			return res.status(400).json(jsonResponse);
		}

		const errors = validateVehiculeFields(req.body);
		if (errors.length > 0) {
			const jsonResponse = createJSONResponse(null, errors.join(', '), req);
			return res.status(400).json(jsonResponse);
		}

		const { marque, model, immatriculation, annee, statut, prix_par_jour, agence_id } = req.body;

		console.log(vehiculeId);
		console.log(req.body);

		database
			.query('SELECT * FROM vehicule WHERE id = ?', [vehiculeId])
			.then(rows => {
				if (rows.length === 0) {
					const jsonResponse = createJSONResponse(null, 'Vehicule not found', req);
					return res.status(404).json(jsonResponse);
				}

				console.log('mise à jour...');

				database
					.query(
						'UPDATE vehicule SET marque = ?, model = ?, immatriculation = ?, annee = ?, statut = ?, prix_par_jour = ?, agence_id = ? WHERE id = ?',
						[marque, model, immatriculation, annee, statut, prix_par_jour, agence_id, vehiculeId]
					)
					.then(() => {
						console.log('Vehicule updated successfully');
						const updatedVehicule = {
							id: vehiculeId,
							agence_id: req.body.agence_id ? req.body.agence_id : null,
							marque,
							model,
							immatriculation,
							annee,
							statut,
							prix_par_jour,
						};

						const jsonResponse = createJSONResponse(updatedVehicule, null, req);
						res.status(200).json(jsonResponse);
					})
					.catch(error => {
						const jsonResponse = createJSONResponse(null, error.message, req);
						res.status(500).json(jsonResponse);
					});
			})
			.catch(error => {
				const jsonResponse = createJSONResponse(null, error.message, req);
				res.status(500).json(jsonResponse);
			});
	},
    deleteVehicule: (req, res) => {
        const vehiculeId = parseInt(req.params.id, 10);
    
        if (isNaN(vehiculeId)) {
            return res.status(400).json({ error: 'ID invalide' });
        }
    
        handleDatabaseQuery('DELETE FROM vehicule WHERE id = ?', [vehiculeId], req, res, () => {
            res.redirect('/vehicules');
        });
    },
    
	
};
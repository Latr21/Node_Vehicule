
import express from 'express';
import { AgenceController } from './Controllers/AgenceController.js';
import { VehiculeController } from './Controllers/VehiculeController.js';
const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.set("views", "./templates");
app.use((req, res, next) => {
    const requestMethod = req.method;
    const requestUrl = req.url;
    console.log(
        '\nMiddleware: Requête reçue à ' +
            new Date() +
            '\n' +
            'Méthode: ' +
            requestMethod +
            '\n' +
            'URL: ' +
            requestUrl +
            '\n'
    );
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./Templates");

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/agences', AgenceController.getAllAgences);
app.get('/agences/:id', AgenceController.getAgenceById);
app.post('/agences/add', AgenceController.createAgence);
app.post('/agences/update/:id', AgenceController.updateAgence);
app.post('/agences/delete/:id', AgenceController.deleteAgence);

app.get('/vehicules', VehiculeController.getAllVehicules);
app.get('/vehicules/:id', VehiculeController.getVehiculeById);
app.post('/vehicules', VehiculeController.createVehicule);
app.put('/vehicules/:id', VehiculeController.updateVehicule);
app.post('/vehicules/delete/:id', VehiculeController.deleteVehicule);

app.listen(port, () => {
    console.log(`Server is running at ${host}:${port}`);
});
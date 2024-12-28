const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk'); // SDK PayPal Commerce Platform

// Configurez votre client PayPal
const clientId = 'AQZB7nCdzF6z7Feq3eq5iDf2QO0pnyvcu-Fyj-r_qAuGFpUhTRfWDwfiywHCrX1UkErDA9kaxr0HoDzq';
const clientSecret = 'EHny0U5tD-2VdP71k3sVPtELuw3fSPajpMOqu5Swk6n42wHhCriK5bdASPvu3lRLbhJ5GoUl7oQV4MRJ';
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret); // Utilisez ProductionEnvironment pour la production
const client = new paypal.core.PayPalHttpClient(environment);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-payment', async (req, res) => {
    const { total } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'USD',
                    value: total.toString(),
                },
            },
        ],
        application_context: {
            return_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        },
    });

    try {
        const order = await client.execute(request);

        // Vérifiez et extrayez les liens
        if (order.result.links && Array.isArray(order.result.links)) {
            const approvalLink = order.result.links.find(link => link.rel === 'approve');
            if (approvalLink) {
                res.json({ approval_url: approvalLink.href });
            } else {
                res.status(500).send("Lien d'approbation non trouvé dans la réponse PayPal.");
            }
        } else {
            res.status(500).send("Structure des liens incorrecte dans la réponse PayPal.");
        }
    } catch (error) {
        console.error("Erreur PayPal:", error);
        res.status(500).send("Erreur lors de la création de la commande PayPal.");
    }
});
// Gestion des redirections
app.get('/success', async (req, res) => {
    const { token } = req.query;
    const request = new paypal.orders.OrdersCaptureRequest(token);

    try {
        const capture = await client.execute(request);
        res.redirect('http://localhost:8081/success'); // URL de succès
    } catch (error) {
        console.error(error);
        res.redirect('http://localhost:8081/failure'); // URL d'échec
    }
});

app.get('/cancel', (req, res) => {
    res.redirect('http://localhost:8081/failure'); // URL d'échec
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur backend lancé sur http://localhost:${PORT}`));
